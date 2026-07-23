import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import MarqueeBand from '@/components/MarqueeBand';
import Rules from '@/components/Rules';
import Calculator from '@/components/Calculator';
import Workouts from '@/components/Workouts';
import Tracker from '@/components/Tracker';
import Shop from '@/components/Shop';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <MarqueeBand />
        <Rules />
        <Calculator />
        <Workouts />
        <Tracker />
        <Shop />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
