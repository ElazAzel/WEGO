export interface CozyFeedback {
  message: string;
  reward: number;
}

export function CozyToast({ feedback, onDismiss }: { feedback: CozyFeedback; onDismiss: () => void }) {
  return <div className="cozy-toast" role="status" onAnimationEnd={onDismiss}>
    <strong>{feedback.message}</strong>
    {feedback.reward > 0 && <span>+{feedback.reward} Искр</span>}
  </div>;
}
