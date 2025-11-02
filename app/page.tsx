// app/page.tsx
'use client';

import React, { useState } from 'react';
import { deriveKey, encryptText, decryptText, b64, ub64 } from './JournalEncrypted'; // Adjust the path as necessary
import { BreathingExercise } from './BreathingExercise'; // Adjust the import for the breathing exercise component
import EncryptedJournal from './EncryptedJournal'; // Adjust the import for the encrypted journal component
import MoodTracker from './MoodTracker'; // Adjust the import for the mood tracker component
import AIChat from './AIChat'; // Adjust the import for the AI chat component

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('SOS Breathing');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'SOS Breathing':
        return <BreathingExercise />;
      case 'Encrypted Journal':
        return <EncryptedJournal />;
      case 'Mood Tracker':
        return <MoodTracker />;
      case 'AI Chat':
        return <AIChat />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4">
      <div className="flex space-x-4 mb-4">
        {['SOS Breathing', 'Encrypted Journal', 'Mood Tracker', 'AI Chat'].map(tab => (
          <button
            key={tab}
            className={`py-2 px-4 rounded ${activeTab === tab ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="border-t border-gray-700 pt-4">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default HomePage;