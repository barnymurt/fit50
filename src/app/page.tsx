import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Rules from '@/components/Rules';
import Calculator from '@/components/Calculator';
import Workouts from '@/components/Workouts';
import Tracker from '@/components/Tracker';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Rules />
        <Calculator />
        <Workouts />
        <Tracker />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
