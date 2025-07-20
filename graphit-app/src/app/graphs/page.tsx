import GeneralGraphTool from '@/components/diagrams/charts/GeneralGraphTool';

export const metadata = {
  title: 'General Graphs | GraphIt!',
  description: 'Create custom bar charts, pie charts, and scatter plots from your own data.',
};

export default function GeneralGraphsPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] py-8">
      <div className="text-center mb-8 flex-shrink-0">
        <h1 className="text-4xl font-extrabold tracking-tight">
          General Graphing Tools
        </h1>
        <p className="mt-2 text-lg text-text/80">
          Create and customize common chart types with your own data.
        </p>
      </div>

      <div className="flex-grow">
        <GeneralGraphTool />
      </div>
    </div>
  );
}