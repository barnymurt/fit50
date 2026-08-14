'use client';

import EmailGate from './EmailGate';
import { FRIDGE_CHECKLIST_CONFIG } from './emailGates';

interface FridgeChecklistProps {
  onSubmitted?: () => void;
  compact?: boolean;
}

export default function FridgeChecklist(_props: FridgeChecklistProps) {
  return <EmailGate config={FRIDGE_CHECKLIST_CONFIG} />;
}