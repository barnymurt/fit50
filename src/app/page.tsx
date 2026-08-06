import Hero from '@/components/Hero';
import Rules from '@/components/Rules';
import Calculator from '@/components/Calculator';
import Workouts from '@/components/Workouts';
import Tracker from '@/components/Tracker';
import FAQ from '@/components/FAQ';

export default function Home() {
  return (
    <>
      <Hero />
      <Rules />
      <Calculator />
      <Workouts />
      <Tracker />
      <FAQ />
    </>
  );
}
