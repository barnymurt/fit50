import Hero from '@/components/Hero';
import Rules from '@/components/Rules';
import Calculator from '@/components/Calculator';
import Workouts from '@/components/Workouts';
import Tracker from '@/components/Tracker';
import SixFeatures from '@/components/SixFeatures';
import FAQ from '@/components/FAQ';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  other: {
    'fo-verify': '12a9a212-f9a2-4ba7-a06d-dd71d62882f8',
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <Rules />
      <Calculator />
      <Workouts />
      <Tracker />
      <SixFeatures id="sign-up" />
      <FAQ />
    </>
  );
}
