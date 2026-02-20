'use client';

import { useState } from 'react';
import WatercolourSection from './WatercolourSection';

export default function Calculator() {
  const [startDate, setStartDate] = useState('');
  const [finishDate, setFinishDate] = useState<Date | null>(null);

  const calculateFinish = () => {
    if (!startDate) return;
    const start = new Date(startDate);
    const finish = new Date(start);
    finish.setDate(finish.getDate() + 49);
    setFinishDate(finish);
  };

  const formatDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  return (
    <WatercolourSection color="#D8B8D0" className="py-24" seed={3}>
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="md:w-1/2">
            <h2 className="font-display text-4xl md:text-5xl text-[#2A2A2A]">
              MARK YOUR<br />CALENDAR
            </h2>
            <p className="font-body text-lg text-[#2A2A2A]/80 mt-6 max-w-md">
              Choose your start date and discover when you&apos;ll emerge transformed. 
              Commit to the process and watch yourself change.
            </p>
          </div>
          
          <div className="md:w-1/2">
            <div className="bg-[#4A9B9B] p-8 rounded-lg">
              <h3 className="font-display text-2xl text-[#FEFEFE] mb-6">
                CALCULATE YOUR FINISH DATE
              </h3>
              
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setFinishDate(null);
                }}
                className="w-full p-4 bg-[#FEFEFE] text-[#2A2A2A] font-body rounded mb-4"
              />
              
              <button
                onClick={calculateFinish}
                disabled={!startDate}
                className="w-full bg-[#2A2A2A] text-[#FEFEFE] font-display text-sm px-6 py-4 uppercase tracking-wider hover:bg-[#2A2A2A]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Calculate Finish Date
              </button>

              {finishDate && (
                <div className="mt-6 p-4 bg-[#FEFEFE]/20 rounded text-center">
                  <p className="font-body text-[#FEFEFE]/80 text-sm uppercase tracking-wider mb-2">
                    You&apos;ll Complete The Challenge On
                  </p>
                  <p className="font-display text-2xl text-[#FEFEFE]">
                    {formatDate(finishDate)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </WatercolourSection>
  );
}
