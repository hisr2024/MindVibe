'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator,
  Animated
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { callKiaanAI } from '@kiaanverse/api/wisdom/kiaanAIService'
import type { GitaVerse } from '@kiaanverse/api/wisdom/gitaWisdomCore'

// ── Types ──────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  verse?: GitaVerse
  timestamp: Date
}

// ── Sacred typing indicator ───────────────────────────────────────────────
function SacredTypingIndicator() {
  const dots = [useRef(new Animated.Value(0.4)).current,
                useRef(new Animated.Value(0.4)).current,
                useRef(new Animated.Value(0.4)).current]

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue:1, duration:400, useNativeDriver:true }),
          Animated.timing(dot, { toValue:0.4, duration:400, useNativeDriver:true }),
        ])
      )
    )
    Animated.parallel(animations).start()
    return () => animations.forEach(a => a.stop())
  }, [])

  return (
    <View style={ts.row}>
      <View style={ts.avatar}><Text style={ts.om}>ॐ</Text></View>
      <View style={ts.bubble}>
        <View style={ts.dotsRow}>
          {dots.map((dot, i) => (
            <Animated.View key={i} style={[ts.dot, { opacity: dot }]}/>
          ))}
          <Text style={ts.reflecting}>  Reflecting on dharma…</Text>
        </View>
      </View>
    </View>
  )
}
const ts = StyleSheet.create({
  row:       { flexDirection:'row', alignItems:'flex-start', marginBottom:12, paddingHorizontal:16 },
  avatar:    { width:28, height:28, borderRadius:14, backgroundColor:'rgba(212,160,23,0.12)',
               borderWidth:1, borderColor:'rgba(212,160,23,0.3)',
               alignItems:'center', justifyContent:'center', marginRight:8, marginTop:4 },
  om:        { fontSize:12, color:'#D4A017' },
  bubble:    { backgroundColor:'rgba(22,26,66,0.9)', borderWidth:1,
               borderColor:'rgba(212,160,23,0.15)', borderRadius:16,
               borderTopLeftRadius:4, padding:12 },
  dotsRow:   { flexDirection:'row', alignItems:'center' },
  dot:       { width:7, height:7, borderRadius:3.5, backgroundColor:'#D4A017', marginRight:5 },
  reflecting:{ fontSize:11, fontFamily:'Outfit-Regular', fontStyle:'italic',
               color:'rgba(240,235,225,0.4)' },
})

// ── Message bubble ────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <View style={[mb.row, isUser ? mb.rowUser : mb.rowBot]}>
      {!isUser && (
        <View style={mb.avatar}><Text style={mb.om}>ॐ</Text></View>
      )}

      <View style={[mb.bubbleWrap, { maxWidth: '78%' }]}>
        {isUser ? (
          <LinearGradient colors={['#1B4FBB','#0E7490']}
            style={mb.userBubble} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Text style={mb.userText}>{message.content}</Text>
          </LinearGradient>
        ) : (
          <View style={mb.botBubble}>
            <View style={mb.botAccentBar}/>
            <View style={{flex:1, padding:12}}>
              <Text style={mb.botText}>{message.content}</Text>
              {message.verse && (
                <View style={mb.verseCard}>
                  <Text style={mb.verseSkt}>{message.verse.sanskrit}</Text>
                  <Text style={mb.verseRef}>
                    BG {message.verse.chapter}.{message.verse.verse}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
const mb = StyleSheet.create({
  row:          { marginBottom:12, paddingHorizontal:16 },
  rowUser:      { alignItems:'flex-end' },
  rowBot:       { flexDirection:'row', alignItems:'flex-start' },
  avatar:       { width:28, height:28, borderRadius:14,
                  backgroundColor:'rgba(212,160,23,0.12)',
                  borderWidth:1, borderColor:'rgba(212,160,23,0.3)',
                  alignItems:'center', justifyContent:'center',
                  marginRight:8, marginTop:4, flexShrink:0 },
  om:           { fontSize:12, color:'#D4A017' },
  bubbleWrap:   {},
  userBubble:   { paddingHorizontal:14, paddingVertical:10,
                  borderRadius:16, borderBottomRightRadius:4 },
  userText:     { fontSize:15, fontFamily:'Outfit-Regular',
                  color:'#F5F0E8', lineHeight:22 },
  botBubble:    { flexDirection:'row', backgroundColor:'rgba(22,26,66,0.92)',
                  borderWidth:1, borderColor:'rgba(212,160,23,0.15)',
                  borderRadius:16, borderTopLeftRadius:4, overflow:'hidden' },
  botAccentBar: { width:2, backgroundColor:'#D4A017' },
  botText:      { fontSize:15, fontFamily:'CrimsonText-Regular',
                  color:'#F0EBE1', lineHeight:26 },
  verseCard:    { marginTop:12, backgroundColor:'rgba(212,160,23,0.06)',
                  borderWidth:1, borderColor:'rgba(212,160,23,0.2)',
                  borderRadius:10, padding:10 },
  verseSkt:     { fontFamily:'NotoSansDevanagari-Regular', fontSize:13,
                  color:'#D4A017', lineHeight:13*2, marginBottom:4 },
  verseRef:     { fontFamily:'Outfit-Regular', fontSize:10,
                  color:'rgba(240,235,225,0.4)', textAlign:'right' },
})

// ── Starter prompts ───────────────────────────────────────────────────────
const STARTERS = [
  'What is my dharma in this moment?',
  'I am afraid. What does Krishna say?',
  'Explain the nature of the Atman',
  'How do I find peace amidst chaos?',
]

// ── MAIN CHAT SCREEN ──────────────────────────────────────────────────────
export default function ChatScreen() {
  const insets = useSafeAreaInsets()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const listRef = useRef<FlatList>(null)
  const history = useRef<Array<{role:string; content:string}>>([])

  const send = useCallback(async (text: string) => {
    const msg = text.trim()
    if (!msg || loading) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setInput('')
    setLoading(true)

    // Add user message
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    history.current.push({ role: 'user', content: msg })

    // Scroll to bottom
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)

    try {
      const result = await callKiaanAI(msg, history.current, 'chat')

      const sakhaMsg: Message = {
        id: `s-${Date.now()}`,
        role: 'assistant',
        content: result.response,
        verse: result.verse,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, sakhaMsg])
      history.current.push({ role: 'assistant', content: result.response })

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err: any) {
      console.error('[Chat]', err)
      const errMsg: Message = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: 'My connection to the cosmic network wavered. Please try again, dear seeker.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150)
    }
  }, [loading])

  return (
    <View style={{ flex:1, backgroundColor:'#050714' }}>
      {/* Header */}
      <View style={[cs.header, { paddingTop: insets.top + 8 }]}>
        <View style={cs.mandala}>
          <Text style={cs.om}>ॐ</Text>
        </View>
        <View>
          <Text style={cs.sakhaName}>Sakha</Text>
          <Text style={cs.sakhaStatus}>
            {loading ? 'Reflecting on dharma…' : 'परमात्मा is listening'}
          </Text>
        </View>
      </View>
      <LinearGradient
        colors={['transparent','rgba(212,160,23,0.4)','transparent']}
        start={{x:0,y:0}} end={{x:1,y:0}}
        style={{ height:1 }}
      />

      <KeyboardAvoidingView style={{flex:1}}
        behavior={Platform.OS==='ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>

        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <View style={cs.emptyState}>
            <View style={cs.emptyMandala}>
              <Text style={cs.emptyOm}>ॐ</Text>
            </View>
            <Text style={cs.emptyTitle}>कहिए</Text>
            <Text style={cs.emptySubtitle}>What would you like to explore?</Text>
            <View style={cs.startersCol}>
              {STARTERS.map(s => (
                <TouchableOpacity key={s} style={cs.starterBtn}
                  onPress={() => send(s)}>
                  <Text style={cs.starterText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={{ paddingTop:16, paddingBottom:8 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={loading ? <SacredTypingIndicator/> : null}
          />
        )}

        {/* ── THE INPUT BAR ─────────────────────────────────────────── */}
        <View style={[cs.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <LinearGradient
            colors={['transparent','rgba(212,160,23,0.5)','transparent']}
            start={{x:0,y:0}} end={{x:1,y:0}}
            style={{ height:1 }}
          />
          <View style={cs.inputRow}>
            {/* Voice button */}
            <TouchableOpacity style={cs.voiceBtn}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Text style={cs.voiceIcon}>🎤</Text>
            </TouchableOpacity>

            {/* Text input */}
            <TextInput
              style={cs.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Ask Sakha anything…"
              placeholderTextColor="rgba(240,235,225,0.28)"
              multiline
              maxLength={2000}
              blurOnSubmit={false}
              returnKeyType="send"
              onSubmitEditing={() => send(input)}
            />

            {/* Send button */}
            <TouchableOpacity
              onPress={() => send(input)}
              disabled={!input.trim() || loading}
              style={[cs.sendBtn, (!input.trim() || loading) && cs.sendBtnOff]}>
              <LinearGradient
                colors={input.trim() && !loading
                  ? ['#1B4FBB','#0E7490']
                  : ['rgba(50,55,80,1)','rgba(50,55,80,1)']}
                style={cs.sendBtnGrad}
                start={{x:0,y:0}} end={{x:1,y:1}}>
                <Text style={cs.sendIcon}>›</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const GOLD = '#D4A017'
const cs = StyleSheet.create({
  header:        { flexDirection:'row', alignItems:'center', gap:12,
                   paddingHorizontal:16, paddingBottom:10 },
  mandala:       { width:44, height:44, borderRadius:22,
                   backgroundColor:'rgba(212,160,23,0.1)',
                   borderWidth:1.5, borderColor:'rgba(212,160,23,0.3)',
                   alignItems:'center', justifyContent:'center' },
  om:            { fontSize:18, color:GOLD },
  sakhaName:     { fontFamily:'CormorantGaramond-Italic', fontSize:20, color:GOLD },
  sakhaStatus:   { fontFamily:'CrimsonText-Italic', fontSize:11,
                   color:'rgba(240,235,225,0.45)', marginTop:1 },
  emptyState:    { flex:1, alignItems:'center', justifyContent:'center',
                   paddingHorizontal:24 },
  emptyMandala:  { width:80, height:80, borderRadius:40,
                   backgroundColor:'rgba(212,160,23,0.08)',
                   borderWidth:1.5, borderColor:'rgba(212,160,23,0.3)',
                   alignItems:'center', justifyContent:'center', marginBottom:16 },
  emptyOm:       { fontSize:36, color:GOLD },
  emptyTitle:    { fontFamily:'NotoSansDevanagari-Bold', fontSize:26,
                   color:GOLD, lineHeight:52, marginBottom:4 },
  emptySubtitle: { fontFamily:'Outfit-Regular', fontSize:15,
                   color:'rgba(240,235,225,0.55)', marginBottom:24 },
  startersCol:   { width:'100%', gap:10 },
  starterBtn:    { backgroundColor:'rgba(22,26,66,0.9)',
                   borderWidth:1, borderColor:'rgba(212,160,23,0.2)',
                   borderRadius:14, paddingVertical:13, paddingHorizontal:16 },
  starterText:   { fontFamily:'Outfit-Regular', fontSize:14,
                   color:'rgba(240,235,225,0.8)', textAlign:'center' },
  inputBar:      { backgroundColor:'rgba(5,7,20,0.97)' },
  inputRow:      { flexDirection:'row', alignItems:'flex-end',
                   paddingHorizontal:10, paddingTop:8, gap:8 },
  voiceBtn:      { width:40, height:40, borderRadius:20,
                   backgroundColor:'rgba(22,26,66,0.8)',
                   borderWidth:1, borderColor:'rgba(212,160,23,0.2)',
                   alignItems:'center', justifyContent:'center', flexShrink:0 },
  voiceIcon:     { fontSize:18 },
  textInput:     { flex:1, backgroundColor:'rgba(22,26,66,0.85)',
                   borderWidth:1, borderColor:'rgba(212,160,23,0.22)',
                   borderRadius:20, paddingHorizontal:16,
                   paddingVertical:10, paddingTop:10,
                   fontSize:15, fontFamily:'CrimsonText-Regular',
                   color:'#F0EBE1', maxHeight:120, minHeight:44 },
  sendBtn:       { width:44, height:44, borderRadius:22,
                   overflow:'hidden', flexShrink:0 },
  sendBtnOff:    { opacity:0.35 },
  sendBtnGrad:   { flex:1, alignItems:'center', justifyContent:'center' },
  sendIcon:      { fontSize:22, color:'#fff', fontWeight:'700' },
})
