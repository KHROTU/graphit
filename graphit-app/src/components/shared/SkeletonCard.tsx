import { Card } from "@/components/ui/Card";

export default function SkeletonCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <div className="animate-pulse p-6 space-y-8">
            <div className="h-6 bg-neutral-dark/50 rounded w-1/2"></div>
            
            <div className="space-y-3">
              <div className="h-4 bg-neutral-dark/50 rounded w-3/4"></div>
              <div className="h-8 bg-neutral-dark/50 rounded-[var(--border-radius-apple)] w-full"></div>
            </div>
            
            <div className="space-y-3">
              <div className="h-4 bg-neutral-dark/50 rounded w-2/3"></div>
              <div className="h-8 bg-neutral-dark/50 rounded-[var(--border-radius-apple)] w-full"></div>
            </div>

            <div className="space-y-3">
              <div className="h-4 bg-neutral-dark/50 rounded w-5/6"></div>
              <div className="h-8 bg-neutral-dark/50 rounded-[var(--border-radius-apple)] w-full"></div>
            </div>
            
            <div className="h-10 bg-neutral-dark/50 rounded-[var(--border-radius-apple)] w-full !mt-12"></div>
          </div>
        </Card>
      </div>
      
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full">
          <div className="animate-pulse p-4 h-full">
            <div className="bg-neutral-dark/50 rounded-[var(--border-radius-apple)] h-full w-full"></div>
          </div>
        </Card>
      </div>
    </div>
  );
};