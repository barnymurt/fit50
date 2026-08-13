import Hero from '@/components/Hero';
import Story from '@/components/Story';
import Rules from '@/components/Rules';
import Resources from '@/components/Resources';
import Workouts from '@/components/Workouts';
import Calculator from '@/components/Calculator';
import Tracker from '@/components/Tracker';
import FAQ from '@/components/FAQ';
import SixFeatures from '@/components/SixFeatures';
import Newsletter from '@/components/Newsletter';
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
      <Story />
      <Rules />
      <Resources id="resources" />
      <Workouts />
      <Calculator />
      <Tracker />
      <FAQ />
      <SixFeatures id="sign-up" />
      <Newsletter />
    </>
  );
}