
import { Question, Match } from '../types';

const RAG_API_URL = 'https://kinjal25-rag-byop-solo-traveller.hf.space.app';

export async function generateRishikeshQuiz(interests: string[]): Promise<Question[]> {
  try {
    const response = await fetch(`${RAG_API_URL}/generate-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interests: interests,
        destination: 'Rishikesh',
        num_questions: 5
      })
    });

    if (!response.ok) {
      throw new Error(`RAG API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid response format from RAG API');
    }

    return data.questions.map((q: any, idx: number) => ({
      id: `q${idx}`,
      text: q.question,
      options: q.options
    }));
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
}

export async function matchTravelers(
  userInterests: string[],
  answers: Record<number, number>,
  questions: Question[]
): Promise<Match[]> {
  try {
    const response = await fetch(`${RAG_API_URL}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quiz_answers: answers,
        destination: 'Rishikesh'
      })
    });

    if (!response.ok) {
      throw new Error(`RAG API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.matches || !Array.isArray(data.matches)) {
      throw new Error('Invalid matches response format');
    }

    return data.matches.map((m: any, idx: number) => {
      const travelStyle = m.travel_style
        ? m.travel_style.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        : 'Spiritual Traveler';

      return {
        id: `match_${idx}`,
        name: m.name || 'Fellow Traveler',
        travelStyle: travelStyle,
        compatibility: m.compatibility || 75,
        interests: extractInterestsFromMetadata(m.metadata),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || 'Traveler')}&background=6366f1&color=fff&bold=true&size=400`
      };
    });
  } catch (error) {
    console.error('Error matching travelers:', error);
    throw error;
  }
}

function extractInterestsFromMetadata(metadata: any): string[] {
  const styleMap: Record<string, string[]> = {
    'adventure_seeker': ['Rafting', 'Bungee', 'Trekking'],
    'spiritual_explorer': ['Yoga', 'Ashrams', 'Meditation'],
    'foodie': ['Street Food', 'Cafes', 'Organic Dining'],
    'wellness_seeker': ['Ayurveda', 'Spa', 'Retreats'],
    'digital_nomad': ['Cafes', 'Coworking', 'Networking'],
    'nature_lover': ['Waterfalls', 'Hiking', 'Riverside'],
    'photographer': ['Ganga Aarti', 'Bridges', 'Landscapes']
  };

  const style = metadata?.travel_style || 'balanced_traveler';
  return styleMap[style] || ['Exploring', 'Yoga', 'Adventure'];
}
