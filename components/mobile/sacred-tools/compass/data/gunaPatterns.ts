export interface GunaPattern {
  id: string
  text: string
  shortLabel: string
  sanskrit: string
}

export const GUNA_PATTERNS: Record<'tamas' | 'rajas' | 'sattva', GunaPattern[]> = {
  tamas: [
    { id: 't1', text: 'We avoid important conversations', shortLabel: 'Avoiding conversations', sanskrit: 'मौन-भय' },
    { id: 't2', text: 'I feel invisible or unheard in this connection', shortLabel: 'Feeling invisible', sanskrit: 'अदृश्य' },
    { id: 't3', text: 'Resentment has accumulated over time', shortLabel: 'Accumulated resentment', sanskrit: 'रोष' },
    { id: 't4', text: 'There is numbness where there used to be feeling', shortLabel: 'Emotional numbness', sanskrit: 'जड़ता' },
    { id: 't5', text: 'We drift apart without addressing it', shortLabel: 'Drifting apart', sanskrit: 'विलगन' },
    { id: 't6', text: 'Fear of conflict keeps us stuck', shortLabel: 'Fear of conflict', sanskrit: 'भय-बंधन' },
    { id: 't7', text: 'Old patterns repeat without transformation', shortLabel: 'Repeating patterns', sanskrit: 'आवृत्ति' },
    { id: 't8', text: 'There is an unspoken power imbalance', shortLabel: 'Power imbalance', sanskrit: 'असमता' },
  ],
  rajas: [
    { id: 'r1', text: 'Arguments arise quickly and intensely', shortLabel: 'Quick arguments', sanskrit: 'कलह' },
    { id: 'r2', text: 'I want to change or fix the other person', shortLabel: 'Fixing the other', sanskrit: 'नियंत्रण' },
    { id: 'r3', text: 'There is jealousy or possessiveness present', shortLabel: 'Jealousy', sanskrit: 'ईर्ष्या' },
    { id: 'r4', text: 'My happiness depends on their approval', shortLabel: 'Approval dependence', sanskrit: 'आश्रित' },
    { id: 'r5', text: 'We compete rather than complement', shortLabel: 'Competing', sanskrit: 'स्पर्धा' },
    { id: 'r6', text: 'Strong attachment to how they show love', shortLabel: 'Love attachment', sanskrit: 'आसक्ति' },
    { id: 'r7', text: 'Comparison with other relationships', shortLabel: 'Comparing', sanskrit: 'तुलना' },
    { id: 'r8', text: 'Intensity that both draws and exhausts', shortLabel: 'Exhausting intensity', sanskrit: 'उग्रता' },
  ],
  sattva: [
    { id: 's1', text: 'We are honest with each other, even when hard', shortLabel: 'Honest even when hard', sanskrit: 'सत्यता' },
    { id: 's2', text: 'There is genuine respect beneath the friction', shortLabel: 'Respect beneath friction', sanskrit: 'आदर' },
    { id: 's3', text: 'This relationship has helped me grow', shortLabel: 'Growth together', sanskrit: 'विकास' },
    { id: 's4', text: 'I see the divine in them, even when difficult', shortLabel: 'Seeing the divine', sanskrit: 'दर्शन' },
    { id: 's5', text: 'We can sit in silence without discomfort', shortLabel: 'Comfortable silence', sanskrit: 'शान्ति' },
    { id: 's6', text: 'Their wellbeing matters to me without condition', shortLabel: 'Unconditional care', sanskrit: 'अनुराग' },
    { id: 's7', text: 'This connection points me toward my dharma', shortLabel: 'Connection to dharma', sanskrit: 'धर्म-पथ' },
    { id: 's8', text: 'We both want the highest for each other', shortLabel: 'Wanting the highest', sanskrit: 'मंगल' },
  ],
}
