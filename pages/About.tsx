
import React from 'react';
import { M3Card, M3Button } from '../components/ui/M3Components';

interface AboutProps {
  onBack: () => void;
}

const About: React.FC<AboutProps> = ({ onBack }) => {
  return (
    <div className="pt-24 pb-32 px-4 max-w-3xl mx-auto w-full page-transition">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-[#0A3D91] transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase italic leading-none">About Travel Tribe</h1>
      </div>

      <div className="space-y-8">
        {/* Section 1: What Travel Tribe Is */}
        <M3Card variant="elevated" className="p-8 md:p-10 bg-white border border-gray-100">
          <span className="text-[10px] font-black text-[#0A3D91] uppercase tracking-[0.3em] block mb-4">The Philosophy</span>
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tight mb-6">What Travel Tribe Is</h2>
          <div className="space-y-4 text-sm text-gray-600 leading-relaxed font-medium">
            <p className="text-lg font-bold text-[#0A3D91] italic">Travel Tribe helps you travel with people you genuinely vibe with — not just a destination.</p>
            <p>Traveling with strangers can be exciting, but it can also feel uncertain. Travel Tribe is built to reduce that uncertainty by focusing on compatibility, comfort, and trust, not just trip details.</p>
            <div className="pt-4 border-t border-gray-50">
              <p className="font-black text-[#0F172A] uppercase tracking-wider">We don’t just help you plan trips.</p>
              <p className="font-black text-[#0A3D91] uppercase tracking-wider">We help you choose the right people to travel with.</p>
            </div>
          </div>
        </M3Card>

        {/* Section 2: What We Do */}
        <M3Card variant="outlined" className="p-8 bg-gray-50/30">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block mb-4">Our Mission</span>
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tight mb-6">What We Do</h2>
          <div className="space-y-6">
            <p className="text-sm text-gray-600 font-medium leading-relaxed">Travel Tribe is a community-driven group travel platform where you can:</p>
            <ul className="space-y-3">
              {[
                'Discover trips created by individuals or verified hosts',
                'Join groups that match your travel style and expectations',
                'See trust indicators that help you feel safer before opting in',
                'Plan travel together transparently before making payments'
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700 font-bold">
                  <span className="text-[#0A3D91]">→</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="p-6 bg-[#0A3D91] rounded-2xl text-center">
              <p className="text-xs font-black text-white uppercase tracking-[0.2em]">Better people → Better trips → Better experiences</p>
            </div>
          </div>
        </M3Card>

        {/* Section 3: What Is a Vibe Check? */}
        <M3Card variant="outlined" className="p-8">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] block mb-4">Compatibility</span>
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tight mb-6">What Is a Vibe Check?</h2>
          <div className="space-y-4 text-sm text-gray-600 font-medium leading-relaxed">
            <p>The Vibe Check helps match travelers based on how they like to travel, not personal details.</p>
            <p className="font-bold text-[#0F172A]">It looks at things like:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['Travel pace and style', 'Planning and flexibility', 'Group energy levels', 'Communication and rhythm'].map((t, i) => (
                <div key={i} className="bg-blue-50/50 p-3 rounded-xl border border-blue-50 text-[11px] font-black uppercase text-[#0A3D91] tracking-tight">
                  • {t}
                </div>
              ))}
            </div>
            <p>Your answers are used only to calculate compatibility with trips and groups.</p>
            <p className="bg-blue-50 p-4 rounded-2xl text-[#0A3D91] font-black italic text-xs">
              👉 This helps you discover trips where you are more likely to feel comfortable and aligned.
            </p>
          </div>
        </M3Card>

        {/* Section 4: What Is a Trust Score? */}
        <M3Card variant="outlined" className="p-8 bg-green-50/10 border-green-100">
          <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.3em] block mb-4">Safety Protocols</span>
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tight mb-6">What Is a Trust Score?</h2>
          <div className="space-y-4 text-sm text-gray-600 font-medium leading-relaxed">
            <p>The Trust Score helps travelers make safer, more confident decisions.</p>
            <div className="space-y-3 pt-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Important things to know:</p>
              {[
                'You cannot see your own trust score',
                'You cannot see individual trust scores of other travelers',
                'You will only see a collective trust level of the travel group'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                   <span className="text-xs font-bold text-gray-800">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-xs italic text-gray-400 mt-4">This keeps the platform fair, respectful, and free from judgment.</p>
          </div>
        </M3Card>

        {/* Section 5: How Trust Is Built */}
        <M3Card variant="outlined" className="p-8">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] block mb-4">Reputation Dynamics</span>
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tight mb-6">How Trust Is Built (High Level)</h2>
          <div className="space-y-6 text-sm text-gray-600 font-medium leading-relaxed">
            <p>Trust on Travel Tribe is built over time using multiple signals, not one action.</p>
            
            <div className="space-y-4">
              <div className="p-5 bg-green-50/50 rounded-[2rem] border border-green-100">
                <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-3">Trust improves when:</p>
                <ul className="space-y-2 text-xs font-bold text-green-800">
                  <li>• Travelers communicate respectfully within the app</li>
                  <li>• Trips are completed smoothly</li>
                  <li>• Co-travelers give positive post-trip feedback</li>
                  <li>• Behavior remains consistent across trips</li>
                </ul>
              </div>

              <div className="p-5 bg-red-50/50 rounded-[2rem] border border-red-100">
                <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-3">Trust may reduce when:</p>
                <ul className="space-y-2 text-xs font-bold text-red-800">
                  <li>• Repeated negative feedback is received</li>
                  <li>• Serious concerns are validated</li>
                  <li>• Community guidelines are violated</li>
                </ul>
              </div>
            </div>
            
            <p className="text-xs font-black text-[#0A3D91] uppercase tracking-widest text-center mt-4 italic">We focus on patterns, not individual messages, and group safety over individual scores.</p>
          </div>
        </M3Card>

        {/* Section 6: Privacy & Transparency */}
        <M3Card variant="outlined" className="p-8 bg-[#001A40] text-white">
          <span className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em] block mb-4">Data Governance</span>
          <h2 className="text-2xl font-black tracking-tight mb-6">Privacy & Transparency</h2>
          <div className="space-y-4 text-sm text-blue-100/70 font-medium leading-relaxed">
            <p className="text-white font-bold">Your privacy matters to us.</p>
            <ul className="space-y-3">
              {[
                'We do not display individual trust scores publicly',
                'We do not track personal content outside the app',
                'Trust indicators are used only to improve safety and compatibility'
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-blue-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-xs italic mt-4 opacity-60">Travel Tribe is designed to support positive travel experiences, not monitor users.</p>
          </div>
        </M3Card>

        {/* Section 7: Why This Matters */}
        <M3Card variant="outlined" className="p-8 border-dashed border-[#0A3D91]/20">
          <span className="text-[10px] font-black text-[#0A3D91] uppercase tracking-[0.3em] block mb-4">The Outcome</span>
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tight mb-6">Why This Matters</h2>
          <div className="space-y-4 text-sm text-gray-600 font-medium leading-relaxed">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 p-6 rounded-3xl">
              <div className="text-center md:text-left">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Traditional Apps</p>
                <p className="text-xs font-bold text-gray-700 italic">“Where do you want to go?”</p>
              </div>
              <div className="text-[#0A3D91] font-black">VS</div>
              <div className="text-center md:text-right">
                <p className="text-[8px] font-black text-[#0A3D91] uppercase tracking-widest">Travel Tribe</p>
                <p className="text-xs font-bold text-[#0A3D91] italic">“Who should you go with?”</p>
              </div>
            </div>
            <p className="text-center font-bold text-[#0F172A] pt-4">By combining Vibe Matching and Collective Trust, we help you travel with confidence.</p>
          </div>
        </M3Card>

        <div className="text-center pt-10 space-y-6">
          <p className="text-xl md:text-2xl font-black text-[#0A3D91] tracking-tighter uppercase italic leading-tight">
            Travel Tribe helps you travel with people you’ll actually enjoy — safely, confidently, and transparently.
          </p>
          <M3Button variant="filled" className="!h-16 shadow-2xl" onClick={onBack}>Start Your Journey</M3Button>
        </div>
      </div>
    </div>
  );
};

export default About;
