'use client'
import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Animated, Easing
} from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { callKiaanForTool } from '@kiaanverse/api/wisdom/kiaanAIService'
import { OmLoader } from '@kiaanverse/ui'

type Step = 'breathing' | 'emotion' | 'intensity' | 'situation' | 'loading' | 'wisdom'

const EMOTIONS = [
  { id:'anger',     label:'Anger',      skt:'क्रोध',  emoji:'🔥', color:'#EF4444' },
  { id:'fear',      label:'Fear',       skt:'भय',     emoji:'💧', color:'#3B82F6' },
  { id:'grief',     label:'Grief',      skt:'शोक',    emoji:'🌧', color:'#6B7280' },
  { id:'anxiety',   label:'Anxiety',    skt:'चिंता',  emoji:'🌀', color:'#8B5CF6' },
  { id:'confusion', label:'Confusion',  skt:'भ्रम',   emoji:'🌫', color:'#F59E0B' },
  { id:'despair',   label:'Despair',    skt:'निराशा', emoji:'🌑', color:'#374151' },
]

// ── SACRED BREATHING CIRCLE ───────────────────────────────────────────────
function BreathingCircle({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase]    = useState<'inhale'|'hold'|'exhale'>('inhale')
  const [count, setCount]    = useState(4)
  const [cycles, setCycles]  = useState(0)
  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(0.6)).current

  useEffect(() => {
    runPhase('inhale')
  }, [])

  const runPhase = (p: 'inhale'|'hold'|'exhale') => {
    setPhase(p)
    const durations = { inhale:4, hold:7, exhale:8 }
    const d = durations[p]
    setCount(d)

    // Animate circle
    Animated.parallel([
      Animated.timing(scale, {
        toValue: p === 'inhale' ? 1.5 : p === 'hold' ? 1.5 : 1.0,
        duration: d * 1000, useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.1, 0.0, 1.0),
      }),
      Animated.timing(opacity, {
        toValue: p === 'inhale' ? 1.0 : p === 'hold' ? 0.9 : 0.5,
        duration: d * 1000, useNativeDriver: true,
      }),
    ]).start()

    // Countdown
    let remaining = d
    const interval = setInterval(() => {
      remaining -= 1
      setCount(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        if (p === 'inhale') runPhase('hold')
        else if (p === 'hold') runPhase('exhale')
        else {
          // One cycle complete
          setCycles(c => {
            const next = c + 1
            if (next >= 3) {
              // 3 cycles done — proceed to emotion step
              setTimeout(onComplete, 500)
            } else {
              runPhase('inhale')
            }
            return next
          })
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }

  const PHASE_TEXT = {
    inhale: { label:'Inhale',  skt:'श्वास लें',   guide:'Breathe in slowly, deeply' },
    hold:   { label:'Hold',    skt:'रोकें',        guide:'Hold your breath gently' },
    exhale: { label:'Exhale',  skt:'छोड़ें',       guide:'Release completely, surrender' },
  }

  const pt = PHASE_TEXT[phase]

  return (
    <View style={br.container}>
      <Text style={br.title}>Sacred Breathing</Text>
      <Text style={br.skt}>प्राणायाम</Text>
      <Text style={br.guide}>3 complete cycles to calm your nervous system</Text>

      {/* The breathing circle */}
      <View style={br.circleContainer}>
        {/* Outer ring (static) */}
        <View style={br.outerRing}/>
        {/* Animated inner circle */}
        <Animated.View style={[br.innerCircle, {
          transform: [{ scale }], opacity
        }]}>
          <Text style={br.countText}>{count}</Text>
        </Animated.View>
      </View>

      <Text style={br.phaseLabel}>{pt.label}</Text>
      <Text style={br.phaseSkt}>{pt.skt}</Text>
      <Text style={br.phaseGuide}>{pt.guide}</Text>
      <Text style={br.cycleCount}>Cycle {Math.min(cycles+1,3)} of 3</Text>
    </View>
  )
}
const br = StyleSheet.create({
  container:     { alignItems:'center', padding:24 },
  title:         { fontFamily:'CormorantGaramond-BoldItalic', fontSize:24,
                   color:'#F0EBE1', marginBottom:4 },
  skt:           { fontFamily:'NotoSansDevanagari-Regular', fontSize:14,
                   color:'#D4A017', lineHeight:28, marginBottom:4 },
  guide:         { fontFamily:'Outfit-Regular', fontSize:13,
                   color:'rgba(240,235,225,0.5)', textAlign:'center', marginBottom:32 },
  circleContainer:{ width:180, height:180, alignItems:'center',
                   justifyContent:'center', marginBottom:24 },
  outerRing:     { position:'absolute', width:180, height:180, borderRadius:90,
                   borderWidth:1.5, borderColor:'rgba(212,160,23,0.2)' },
  innerCircle:   { width:140, height:140, borderRadius:70,
                   backgroundColor:'rgba(27,79,187,0.25)',
                   borderWidth:2, borderColor:'rgba(27,79,187,0.6)',
                   alignItems:'center', justifyContent:'center',
                   shadowColor:'#1B4FBB', shadowRadius:30, shadowOpacity:0.5,
                   elevation:8 },
  countText:     { fontFamily:'CormorantGaramond-BoldItalic',
                   fontSize:48, color:'#D4A017' },
  phaseLabel:    { fontFamily:'Outfit-SemiBold', fontSize:18, color:'#F0EBE1' },
  phaseSkt:      { fontFamily:'NotoSansDevanagari-Regular', fontSize:14,
                   color:'#D4A017', lineHeight:28, marginTop:2 },
  phaseGuide:    { fontFamily:'CrimsonText-Italic', fontSize:14,
                   color:'rgba(240,235,225,0.55)', marginTop:4, textAlign:'center' },
  cycleCount:    { fontFamily:'Outfit-Regular', fontSize:12,
                   color:'rgba(240,235,225,0.3)', marginTop:16 },
})

// ── MAIN EMOTIONAL RESET SCREEN ───────────────────────────────────────────
export default function EmotionalResetScreen() {
  const insets = useSafeAreaInsets()
  const [step, setStep]           = useState<Step>('breathing')
  const [emotion, setEmotion]     = useState('')
  const [intensity, setIntensity] = useState(0)
  const [situation, setSituation] = useState('')
  const [wisdom, setWisdom]       = useState('')
  const [verse, setVerse]         = useState<any>(null)
  const [loading, setLoading]     = useState(false)

  const handleGetWisdom = async () => {
    setStep('loading')
    try {
      const result = await callKiaanForTool('Emotional Reset', {
        emotion,
        intensity: String(intensity),
        situation,
      })
      setWisdom(result.response)
      setVerse(result.verse)
      setStep('wisdom')
    } catch {
      setWisdom('Sakha is temporarily unreachable. Please try again. 🙏')
      setStep('wisdom')
    }
  }

  return (
    <View style={{ flex:1, backgroundColor:'#050714' }}>
      <ScrollView contentContainerStyle={{
        paddingHorizontal:20,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 80,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom:16 }}>
          <Text style={sc.back}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={[sc.title, { color:'#EF4444' }]}>Emotional Reset</Text>
        <Text style={sc.skt}>भावनात्मक पुनर्स्थापना</Text>
        <Text style={sc.sub}>Return to sacred equilibrium</Text>

        {/* Progress dots */}
        {step !== 'loading' && step !== 'wisdom' && (
          <View style={sc.progressRow}>
            {['breathing','emotion','intensity','situation'].map((s,i) => (
              <View key={s} style={[sc.dot,
                { backgroundColor: ['breathing','emotion','intensity','situation']
                  .indexOf(step) >= i ? '#EF4444' : 'rgba(255,255,255,0.1)' }]}/>
            ))}
          </View>
        )}

        {/* STEP: Breathing */}
        {step === 'breathing' && (
          <BreathingCircle onComplete={() => setStep('emotion')}/>
        )}

        {/* STEP: Emotion selection */}
        {step === 'emotion' && (
          <View style={sc.card}>
            <Text style={sc.question}>What emotion is overwhelming you right now?</Text>
            <View style={sc.emotionGrid}>
              {EMOTIONS.map(e => (
                <TouchableOpacity key={e.id}
                  style={[sc.emotionCard,
                    emotion === e.id && { borderColor:e.color,
                      backgroundColor:`${e.color}18` }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setEmotion(e.id)
                  }}>
                  <Text style={sc.emotionEmoji}>{e.emoji}</Text>
                  <Text style={[sc.emotionLabel,
                    emotion === e.id && { color:e.color }]}>{e.label}</Text>
                  <Text style={[sc.emotionSkt,
                    emotion === e.id && { color:e.color }]}>{e.skt}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[sc.nextBtn, !emotion && sc.nextBtnOff]}
              onPress={() => emotion && setStep('intensity')}
              disabled={!emotion}>
              <LinearGradient colors={['#1B4FBB','#0E7490']}
                style={sc.nextBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                <Text style={sc.nextBtnText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP: Intensity */}
        {step === 'intensity' && (
          <View style={sc.card}>
            <Text style={sc.question}>How intense is this feeling? (1–10)</Text>
            <View style={sc.intensityRow}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <TouchableOpacity key={n}
                  style={[sc.intensityDot,
                    intensity === n && { backgroundColor:'#EF4444',
                      borderColor:'#EF4444' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setIntensity(n)
                  }}>
                  <Text style={[sc.intensityNum,
                    intensity === n && { color:'#fff' }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[sc.nextBtn, !intensity && sc.nextBtnOff]}
              onPress={() => intensity && setStep('situation')}
              disabled={!intensity}>
              <LinearGradient colors={['#1B4FBB','#0E7490']}
                style={sc.nextBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                <Text style={sc.nextBtnText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP: Situation */}
        {step === 'situation' && (
          <View style={sc.card}>
            <Text style={sc.question}>
              Describe what triggered this feeling. Share freely — this is your sacred space.
            </Text>
            <TextInput
              style={sc.textInput}
              value={situation}
              onChangeText={setSituation}
              placeholder="What happened? How are you feeling?"
              placeholderTextColor="rgba(240,235,225,0.28)"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <TouchableOpacity style={[sc.nextBtn, !situation.trim() && sc.nextBtnOff]}
              onPress={handleGetWisdom}
              disabled={!situation.trim()}>
              <LinearGradient colors={['#EF4444','#DC2626']}
                style={sc.nextBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                <Text style={sc.nextBtnText}>Receive Sacred Wisdom</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading */}
        {step === 'loading' && (
          <View style={sc.loadingCenter}>
            <OmLoader size={56} label="Sakha is reflecting on your heart…"/>
          </View>
        )}

        {/* Wisdom result */}
        {step === 'wisdom' && (
          <View style={sc.wisdomCard}>
            <Text style={sc.wisdomTitle}>✦ Sakha's Sacred Wisdom</Text>
            <View style={sc.wisdomDivider}/>
            <Text style={sc.wisdomText}>{wisdom}</Text>
            {verse && (
              <View style={sc.verseBox}>
                <Text style={sc.verseLabel}>Gita Verse</Text>
                <Text style={sc.verseSkt}>{verse.sanskrit}</Text>
                <Text style={sc.verseMeaning}>{verse.meaning}</Text>
                <Text style={sc.verseRef}>BG {verse.chapter}.{verse.verse}</Text>
              </View>
            )}
            <TouchableOpacity style={sc.resetBtn}
              onPress={() => {
                setStep('breathing'); setEmotion(''); setIntensity(0)
                setSituation(''); setWisdom(''); setVerse(null)
              }}>
              <Text style={sc.resetText}>Begin Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const sc = StyleSheet.create({
  back:          { fontSize:15, color:'rgba(240,235,225,0.45)',
                   fontFamily:'Outfit-Regular', marginBottom:0 },
  title:         { fontSize:26, fontFamily:'CormorantGaramond-BoldItalic' },
  skt:           { fontFamily:'NotoSansDevanagari-Regular', fontSize:14,
                   color:'#D4A017', lineHeight:28, marginTop:2 },
  sub:           { fontFamily:'Outfit-Regular', fontSize:13,
                   color:'rgba(240,235,225,0.45)', marginTop:4, marginBottom:16 },
  progressRow:   { flexDirection:'row', gap:8, marginBottom:20 },
  dot:           { flex:1, height:3, borderRadius:2 },
  card:          { backgroundColor:'rgba(22,26,66,0.92)', borderWidth:1,
                   borderColor:'rgba(212,160,23,0.12)', borderRadius:16,
                   padding:20, marginBottom:16 },
  question:      { fontFamily:'CormorantGaramond-Italic', fontSize:18,
                   color:'#F0EBE1', lineHeight:26, marginBottom:16 },
  emotionGrid:   { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:16 },
  emotionCard:   { width:'30%', backgroundColor:'rgba(255,255,255,0.04)',
                   borderWidth:1, borderColor:'rgba(212,160,23,0.15)',
                   borderRadius:12, padding:12, alignItems:'center', gap:4 },
  emotionEmoji:  { fontSize:22 },
  emotionLabel:  { fontFamily:'Outfit-Medium', fontSize:12,
                   color:'rgba(240,235,225,0.7)' },
  emotionSkt:    { fontFamily:'NotoSansDevanagari-Regular', fontSize:10,
                   color:'rgba(212,160,23,0.6)', lineHeight:20 },
  intensityRow:  { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16 },
  intensityDot:  { width:44, height:44, borderRadius:22, borderWidth:1,
                   borderColor:'rgba(212,160,23,0.25)',
                   backgroundColor:'rgba(255,255,255,0.05)',
                   alignItems:'center', justifyContent:'center' },
  intensityNum:  { fontFamily:'Outfit-SemiBold', fontSize:15,
                   color:'rgba(240,235,225,0.5)' },
  textInput:     { backgroundColor:'rgba(5,7,20,0.6)', borderWidth:1,
                   borderColor:'rgba(212,160,23,0.2)', borderRadius:12,
                   padding:14, fontSize:15, fontFamily:'CrimsonText-Regular',
                   color:'#F0EBE1', lineHeight:24, minHeight:120,
                   textAlignVertical:'top', marginBottom:16 },
  nextBtn:       { borderRadius:12, overflow:'hidden' },
  nextBtnOff:    { opacity:0.4 },
  nextBtnGrad:   { paddingVertical:14, alignItems:'center' },
  nextBtnText:   { fontFamily:'Outfit-SemiBold', fontSize:16, color:'#fff' },
  loadingCenter: { alignItems:'center', paddingVertical:64 },
  wisdomCard:    { backgroundColor:'rgba(22,26,66,0.92)', borderWidth:1,
                   borderColor:'rgba(212,160,23,0.2)', borderRadius:16, padding:20 },
  wisdomTitle:   { fontFamily:'Outfit-SemiBold', fontSize:16, color:'#D4A017' },
  wisdomDivider: { height:1, backgroundColor:'rgba(212,160,23,0.25)',
                   marginVertical:12 },
  wisdomText:    { fontFamily:'CrimsonText-Regular', fontSize:16,
                   color:'#F0EBE1', lineHeight:26, marginBottom:16 },
  verseBox:      { backgroundColor:'rgba(212,160,23,0.06)', borderWidth:1,
                   borderColor:'rgba(212,160,23,0.2)', borderRadius:12, padding:14 },
  verseLabel:    { fontFamily:'Outfit-SemiBold', fontSize:10, color:'#D4A017',
                   letterSpacing:0.12, textTransform:'uppercase', marginBottom:6 },
  verseSkt:      { fontFamily:'NotoSansDevanagari-Regular', fontSize:14,
                   color:'#D4A017', lineHeight:28, marginBottom:6 },
  verseMeaning:  { fontFamily:'CrimsonText-Regular', fontSize:13,
                   color:'rgba(240,235,225,0.7)', lineHeight:20 },
  verseRef:      { fontFamily:'Outfit-Regular', fontSize:10,
                   color:'rgba(240,235,225,0.35)', marginTop:6, textAlign:'right' },
  resetBtn:      { marginTop:16, alignItems:'center', paddingVertical:12,
                   borderRadius:12, borderWidth:1,
                   borderColor:'rgba(212,160,23,0.2)' },
  resetText:     { fontFamily:'Outfit-Regular', fontSize:13,
                   color:'rgba(240,235,225,0.4)' },
})
