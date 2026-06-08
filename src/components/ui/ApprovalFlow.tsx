import React from 'react';
import { Check } from 'lucide-react';

interface ApprovalFlowProps {
  steps: string[];
  currentStep: number;
  onApprove: () => void;
  onReject: () => void;
  currentUserRole: string;
}

const ApprovalFlow: React.FC<ApprovalFlowProps> = ({ steps, currentStep, onApprove, onReject, currentUserRole }) => {
  const isCurrentActor = steps[currentStep] === currentUserRole;

  return (
    <div className="bg-[#0d1f3c]/80 border border-cyan-500/20 rounded-lg p-4">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i < currentStep
                    ? 'bg-green-500 text-white'
                    : i === currentStep
                    ? 'bg-cyan-400 text-[#0a1628] animate-pulse'
                    : 'bg-gray-700 text-gray-500'
                }`}
              >
                {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs ${i <= currentStep ? 'text-cyan-400' : 'text-gray-600'}`}>{step}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? 'bg-green-500' : 'bg-gray-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
      {isCurrentActor && (
        <div className="flex gap-3 mt-5 justify-end">
          <button onClick={onReject} className="px-4 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 text-sm transition-colors">
            驳回
          </button>
          <button onClick={onApprove} className="px-4 py-1.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-500/30 text-sm transition-colors">
            审批通过
          </button>
        </div>
      )}
    </div>
  );
};

export default ApprovalFlow;
