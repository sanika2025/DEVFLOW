import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ComponentSidebar } from '../components/sandbox/ComponentSidebar';
import { Canvas } from '../components/sandbox/Canvas';
import { Toolbar } from '../components/sandbox/Toolbar';
import { PropertiesPanel } from '../components/sandbox/Properties';
import Swal from 'sweetalert2';
import { useDiagramStore } from '../store/useDiagramStore';

function SandboxContainer() {
  const nodes = useDiagramStore(state => state.nodes);

  const handleValidate = () => {
    if (nodes.length < 3) {
      Swal.fire({
        icon: 'warning',
        title: 'Not quite enough!',
        text: 'Try adding a few more components to build a complete system before validating.',
        confirmButtonColor: '#6366f1',
      });
      return;
    }
    
    // Pass generic JSON format
    console.log("Validating architecture:", JSON.stringify({ nodes }, null, 2));

    Swal.fire({
      icon: 'success',
      title: 'Architecture Looks Solid!',
      text: 'You have a good foundational design here. In a real scenario, this JSON would be sent to the AI Mentor for deep grading.',
      confirmButtonColor: '#10b981',
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-sm relative">
      <Toolbar onValidate={handleValidate} />
      
      <div className="flex flex-1 overflow-hidden relative">
        <ComponentSidebar />
        <Canvas />
        <PropertiesPanel />
      </div>
    </div>
  );
}

export default function SystemDesignSandbox() {
  return (
    <div className="h-[calc(100vh-6rem)] min-h-[600px] w-full">
      <ReactFlowProvider>
        <SandboxContainer />
      </ReactFlowProvider>
    </div>
  );
}
