import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Calculator from '@/components/Calculator';
import Rules from '@/components/Rules';
import Workouts from '@/components/Workouts';
import Tracker from '@/components/Tracker';
import Shop from '@/components/Shop';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <div id="calculator">
        <Calculator />
      </div>
      <div id="rules">
        <Rules />
      </div>
      <div id="workouts">
        <Workouts />
      </div>
      <div id="tracker">
        <Tracker />
      </div>
      <div id="shop">
        <Shop />
      </div>
      <div id="faq">
        <FAQ />
      </div>
      <Footer />
    </main>
  );
}
