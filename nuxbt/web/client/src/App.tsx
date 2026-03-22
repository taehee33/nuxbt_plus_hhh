import { useEffect, useState } from 'react';
import { socket } from './socket';
import type { AppState, BluetoothAdapter, HostUsbDevice } from './types';
import { Plus, Gamepad2, AlertCircle, ArrowLeft, X } from 'lucide-react';
import { ControllerVisual } from './components/ControllerVisual';
import { ThemeToggle } from './components/ThemeToggle';
import { MacroControls } from './components/MacroControls';
import { KeyBindings } from './components/KeyBindings';

const HOST_USB_BRIDGE_URL = 'http://127.0.0.1:8765/api/usb-host';

function App() {
  const [controllers, setControllers] = useState<AppState>({});
  const [adapters, setAdapters] = useState<BluetoothAdapter[]>([]);
  const [adapterError, setAdapterError] = useState<string | null>(null);
  const [hostUsbDevices, setHostUsbDevices] = useState<HostUsbDevice[]>([]);
  const [hostUsbError, setHostUsbError] = useState<string | null>(null);
  const [hostUsbSource, setHostUsbSource] = useState<'host-bridge' | 'vm-fallback' | null>(null);
  const [selectedAdapterPath, setSelectedAdapterPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedController, setSelectedController] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'macros' | 'bindings'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('activeTab');
        if (saved === 'macros' || saved === 'bindings') return saved;
    }
    return 'bindings';
  });

  useEffect(() => {
      localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    function onState(value: AppState) {
      setControllers(value);
    }

    function onControllerCreated(index: number) {
        setSelectedController(index.toString());
    }

    function onError(err: string) {
      setError(err);
    }

    socket.on('state', onState);
    socket.on('error', onError);
    socket.on('create_pro_controller', onControllerCreated);

    // Global Error Handlers
    const handleGlobalError = (event: ErrorEvent) => onError(event.message);
    const handlePromiseError = (event: PromiseRejectionEvent) => onError(String(event.reason));
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handlePromiseError);

    return () => {
      socket.off('state', onState);
      socket.off('error', onError);
      socket.off('create_pro_controller', onControllerCreated);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handlePromiseError);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAdapters() {
      try {
        const response = await fetch('/api/adapters');
        if (!response.ok) {
          throw new Error('Failed to load adapters');
        }

        const payload = await response.json();
        if (cancelled) {
          return;
        }

        setAdapters(Array.isArray(payload.adapters) ? payload.adapters : []);
        setAdapterError(payload.error ?? null);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setAdapterError(err instanceof Error ? err.message : String(err));
      }
    }

    loadAdapters();
    const intervalId = window.setInterval(loadAdapters, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHostUsbDevices() {
      async function applyPayload(response: Response, source: 'host-bridge' | 'vm-fallback') {
        if (!response.ok) {
          throw new Error(`Failed to load host USB devices from ${source}`);
        }

        const payload = await response.json();
        if (cancelled) {
          return;
        }

        setHostUsbDevices(Array.isArray(payload.devices) ? payload.devices : []);
        setHostUsbError(payload.error ?? null);
        setHostUsbSource(source);
      }

      try {
        try {
          await applyPayload(await fetch(HOST_USB_BRIDGE_URL), 'host-bridge');
          return;
        } catch {
          await applyPayload(await fetch('/api/host-usb-devices'), 'vm-fallback');
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        setHostUsbDevices([]);
        setHostUsbError(err instanceof Error ? err.message : String(err));
        setHostUsbSource(null);
      }
    }

    loadHostUsbDevices();
    const intervalId = window.setInterval(loadHostUsbDevices, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (adapters.length === 0) {
      setSelectedAdapterPath(null);
      return;
    }

    const selectedStillExists = selectedAdapterPath && adapters.some((adapter) => adapter.path === selectedAdapterPath);
    if (selectedStillExists) {
      return;
    }

    const recommendedAdapter = adapters.find((adapter) => adapter.recommended);
    setSelectedAdapterPath(recommendedAdapter?.path ?? adapters[0].path);
  }, [adapters, selectedAdapterPath]);

  const createController = () => {
    socket.emit('create_pro_controller', { adapter_path: selectedAdapterPath });
  };

  const removeController = (index: string) => {
    socket.emit('shutdown', parseInt(index));
    if (selectedController === index) {
        setSelectedController(null);
    }
  };

  const currentController = selectedController ? controllers[selectedController] : null;
  const selectedAdapter = adapters.find((adapter) => adapter.path === selectedAdapterPath) ?? null;

  return (
<div className="min-h-screen bg-lavender-50 dark:bg-[#1a1a2e] text-slate-900 dark:text-lavender-100 font-sans selection:bg-honey-200 selection:text-honey-900 transition-colors duration-300">
      <header className="bg-white/80 dark:bg-[#252540]/90 backdrop-blur-md border-b border-lavender-200 dark:border-slate-800 py-4 sticky top-0 z-10 transition-colors duration-300">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedController(null)}>
            <div className="bg-honey-400 p-2 rounded-xl shadow-lg shadow-honey-400/20 text-white">
              <Gamepad2 size={24} />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-honey-600 to-indigo-600 bg-clip-text text-transparent">
              NUXBT
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative">
        {/* Global Error Modal */}
        {error && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-rose-200 dark:border-rose-900 relative animate-in zoom-in-95 duration-200">
                    <button 
                        onClick={() => setError(null)} 
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                            <AlertCircle size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Application Error</h3>
                        <p className="text-slate-600 dark:text-slate-300 max-h-40 overflow-y-auto">{error}</p>
                        <a 
                            href={`https://github.com/hannahbee91/nuxbt/issues/new?title=Application+Error&body=${encodeURIComponent("Error Context:\n" + error)}&labels=bug`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-rose-600/20"
                        >
                            Report Bug on GitHub
                        </a>
                    </div>
                </div>
            </div>
        )}

        {!selectedController ? (
            // DASHBOARD VIEW
            <div className="flex flex-wrap justify-center gap-6 animate-in fade-in duration-500">
            {/* Create Controller Card */}
            <button
                onClick={createController}
                disabled={!selectedAdapterPath}
                className="group relative flex flex-col items-center justify-center p-8 h-64 w-full md:w-80 rounded-2xl border-2 border-dashed border-lavender-300 dark:border-slate-700 hover:border-honey-400 dark:hover:border-honey-400 hover:bg-honey-50/50 dark:hover:bg-honey-900/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-lavender-300 disabled:dark:hover:border-slate-700 disabled:hover:bg-transparent transition-all duration-300"
            >
                <div className="w-16 h-16 bg-lavender-100 dark:bg-[#252540] rounded-full flex items-center justify-center text-lavender-400 dark:text-honey-400/50 group-hover:bg-honey-100 dark:group-hover:bg-honey-900/20 group-hover:text-honey-500 transition-colors duration-300 mb-4">
                <Plus size={32} />
                </div>
                <span className="text-lg font-medium text-slate-500 dark:text-slate-400 group-hover:text-honey-600 dark:group-hover:text-honey-400">
                Create Pro Controller
                </span>
                <span className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
                    {selectedAdapter
                      ? `Uses: ${selectedAdapter.alias || selectedAdapter.name || selectedAdapter.path.split('/').pop()}`
                      : 'No adapter selected'}
                </span>
            </button>

            <div className="w-full md:w-80 bg-white dark:bg-[#252540] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden text-left">
                <div className="p-4 border-b border-slate-50 dark:border-slate-700 bg-gradient-to-r from-lavender-50 to-transparent dark:from-slate-700/30">
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-700 dark:text-lavender-200">Detected Adapters</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            {adapters.length}
                        </span>
                    </div>
                </div>
                <div className="p-4 space-y-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                        This list shows every Bluetooth adapter BlueZ currently exposes to NUXBT. The selected item is used for the next controller you create.
                    </div>

                    {adapterError ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                            {adapterError}
                        </div>
                    ) : null}

                    {adapters.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            No Bluetooth adapters detected by BlueZ.
                        </div>
                    ) : (
                        <>
                            {adapters.length === 1 ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                                    Only one Bluetooth adapter is currently visible to BlueZ. Connect and pass through another USB Bluetooth dongle if you want more adapter choices here.
                                </div>
                            ) : null}

                            {adapters.map((adapter) => (
                                <div
                                    key={adapter.path}
                                    className={`rounded-xl border px-3 py-3 transition-colors ${
                                        adapter.path === selectedAdapterPath
                                            ? 'border-honey-300 bg-honey-50/80 dark:border-honey-700 dark:bg-honey-900/10'
                                            : 'border-slate-100 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="font-medium text-slate-800 dark:text-slate-100">
                                                {adapter.alias || adapter.name || adapter.path.split('/').pop()}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                {adapter.address || 'No adapter address'}
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            adapter.powered
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                            {adapter.powered ? 'Powered' : 'Off'}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                        {adapter.recommended ? (
                                            <span className="px-2 py-1 rounded-full bg-honey-100 text-honey-700 dark:bg-honey-900/30 dark:text-honey-300">
                                                Recommended
                                            </span>
                                        ) : null}
                                        {adapter.path === selectedAdapterPath ? (
                                            <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                                Active Selection
                                            </span>
                                        ) : null}
                                        <span className={`px-2 py-1 rounded-full ${
                                            adapter.available
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                            {adapter.available ? 'Available' : 'Unavailable'}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full ${
                                            adapter.in_use
                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                            {adapter.in_use ? 'In Use' : 'Free'}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full ${
                                            adapter.pairable
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                            {adapter.pairable ? 'Pairable' : 'Not Pairable'}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full ${
                                            adapter.discoverable
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                            {adapter.discoverable ? 'Discoverable' : 'Hidden'}
                                        </span>
                                    </div>
                                    <div className="mt-3 grid gap-1 text-xs text-slate-500 dark:text-slate-400">
                                        <div>
                                            Manufacturer: {adapter.manufacturer_name ?? 'Unknown'}
                                        </div>
                                        <div>
                                            Product: {adapter.product_name ?? 'Unknown'}
                                        </div>
                                        <div>
                                            USB ID: {adapter.vendor_id && adapter.product_id ? `${adapter.vendor_id}:${adapter.product_id}` : 'Unknown'}
                                        </div>
                                        <div>
                                            Recommendation: {adapter.recommendation_reason}
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-3">
                                        <div className="text-[11px] text-slate-400 dark:text-slate-500 break-all">
                                            {adapter.path}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAdapterPath(adapter.path)}
                                            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                                adapter.path === selectedAdapterPath
                                                    ? 'bg-honey-500 text-white'
                                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                                            }`}
                                        >
                                            {adapter.path === selectedAdapterPath ? 'Selected' : 'Select'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            <div className="w-full md:w-80 bg-white dark:bg-[#252540] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden text-left">
                <div className="p-4 border-b border-slate-50 dark:border-slate-700 bg-gradient-to-r from-lavender-50 to-transparent dark:from-slate-700/30">
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-700 dark:text-lavender-200">Host USB Devices</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            {hostUsbDevices.length}
                        </span>
                    </div>
                </div>
                <div className="p-4 space-y-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                        This panel prefers the macOS host bridge on <span className="font-mono">127.0.0.1:8765</span>. If that bridge is not running, it falls back to the VM and may be empty.
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                        Source: {hostUsbSource === 'host-bridge' ? 'macOS host bridge' : hostUsbSource === 'vm-fallback' ? 'VM fallback' : 'Unavailable'}
                    </div>

                    {hostUsbError ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                            {hostUsbError}
                        </div>
                    ) : null}

                    {!hostUsbError && hostUsbDevices.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            No host USB devices reported.
                        </div>
                    ) : null}

                    {hostUsbDevices.map((device) => (
                        <div
                            key={device.uuid ?? `${device.vendor_id}:${device.product_id}:${device.product_name}`}
                            className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40"
                        >
                            <div className="font-medium text-slate-800 dark:text-slate-100">
                                {device.product_name ?? 'Unknown USB Device'}
                            </div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Manufacturer: {device.manufacturer_name ?? 'Unknown'}
                            </div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                USB ID: {device.vendor_id && device.product_id ? `${device.vendor_id}:${device.product_id}` : 'Unknown'}
                            </div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                State: {device.current_state ?? 'Unknown'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controller Cards */}
            {Object.entries(controllers).map(([index, controller]) => (
                <div 
                    key={index} 
                    onClick={() => setSelectedController(index)}
                    className="w-full md:w-80 bg-white dark:bg-[#252540] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-md hover:border-honey-300 dark:hover:border-honey-700 transition-all duration-300 cursor-pointer group"
                >
                <div className="p-4 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-lavender-50 to-transparent dark:from-slate-700/30">
                    <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-honey-400 group-hover:animate-pulse" />
                    <span className="font-semibold text-slate-700 dark:text-lavender-200">Controller {parseInt(index) + 1}</span>
                    </div>
                </div>
                
                <div className="p-6">
                    <div className="bg-slate-50 dark:bg-[#1a1a2e] rounded-xl relative mb-4 border border-slate-100 dark:border-slate-800 flex items-center justify-center p-4">
                        <Gamepad2 size={48} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                         <span className={`px-2 py-1 rounded-full font-medium ${
                            controller.state === 'connected' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            controller.state === 'initializing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                            }`}>
                            {controller.state}
                        </span>
                    </div>
                </div>
                </div>
            ))}
            </div>
        ) : (
            // CONTROLLER SESSION VIEW
            <div className="max-w-6xl mx-auto animate-in slide-in-from-right-4 duration-300">
                <button 
                    onClick={() => setSelectedController(null)}
                    className="flex items-center gap-2 mb-6 text-slate-500 dark:text-slate-400 hover:text-honey-600 dark:hover:text-honey-400 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                {currentController ? (
                    <div className="flex flex-col xl:flex-row gap-8 items-start animate-in slide-in-from-right-4 duration-300">
                        {/* Left Column: Visual Controller */}
                        <div className="w-full xl:w-2/3">
                             <div className="bg-white dark:bg-[#252540] rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 mb-6 transition-all duration-300">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold flex items-center gap-3 dark:text-lavender-100">
                                        <span className={`w-4 h-4 rounded-full shadow-sm transition-colors duration-500 ${
                                            currentController.state === 'connected' ? 'bg-emerald-500 shadow-emerald-500/50' : 
                                            currentController.state === 'initializing' ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'
                                        }`} />
                                        Pro Controller {parseInt(selectedController) + 1}
                                    </h2>
                                    <div className="flex items-center gap-4">
                                         <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                                            currentController.state === 'connected' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                                            currentController.state === 'initializing' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                                            currentController.state === 'crashed' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                                            'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
                                        }`}>
                                            {currentController.state}
                                        </span>
                                        <button 
                                            onClick={() => removeController(selectedController)}
                                            className="px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors font-medium border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                                        >
                                            Shutdown
                                        </button>
                                    </div>
                                </div>

                                {currentController.state === 'crashed' && currentController.errors && (
                                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                                        <strong>Controller Error:</strong> {currentController.errors}
                                        <div className="mt-3">
                                            <a 
                                                href={`https://github.com/hannahbee91/nuxbt/issues/new?title=Controller+Error&body=${encodeURIComponent("Error Context:\n" + currentController.errors)}&labels=bug`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors font-medium text-sm"
                                            >
                                                <AlertCircle size={16} />
                                                Report Bug on GitHub
                                            </a>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex items-center justify-center p-4">
                                    <ControllerVisual 
                                        index={selectedController} 
                                        input={currentController.direct_input} 
                                        setInput={() => {
                                            // Optimistic update handled in Visual, logic here if needed
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Controls & Info */}
                        <div className="w-full xl:w-1/3 flex flex-col gap-6">
                            <div className="bg-white dark:bg-[#252540] rounded-2xl p-1 shadow-sm border border-slate-100 dark:border-slate-800 flex">
                                <button 
                                    onClick={() => setActiveTab('bindings')}
                                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        activeTab === 'bindings' 
                                        ? 'bg-honey-400 text-white shadow-md shadow-honey-400/20' 
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    Key Bindings
                                </button>
                                <button 
                                    onClick={() => setActiveTab('macros')}
                                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        activeTab === 'macros' 
                                        ? 'bg-honey-400 text-white shadow-md shadow-honey-400/20' 
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    Macros
                                </button>
                            </div>

                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div style={{ display: activeTab === 'macros' ? 'block' : 'none' }}>
                                    <MacroControls 
                                        controllerIndex={selectedController} 
                                        input={currentController.direct_input}
                                        controllerState={currentController}
                                    />
                                </div>
                                <div style={{ display: activeTab === 'bindings' ? 'block' : 'none' }}>
                                    <KeyBindings />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400 gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-honey-500 animate-spin" />
                        <p>Connecting to controller...</p>
                        <p className="text-xs text-slate-400 dark:text-slate-600">If this takes too long, go back and try again.</p>
                        <button 
                            onClick={() => setSelectedController(null)}
                            className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                )}
            </div>
        )}

        <footer className="mt-12 text-center text-slate-500 dark:text-slate-400 text-sm pb-8">
            <p className="mb-2">Source Code and Documentation Available <a href="https://github.com/hannahbee91/nuxbt" target="_blank" className="text-honey-600 dark:text-honey-400 hover:underline">Here</a></p>
            <p>Made By <a href="https://hannahis.gay" target="_blank" className="text-honey-600 dark:text-honey-400 hover:underline">Hannah Brown</a>, with original implementation by <a href="https://github.com/brikwerk" target="_blank" className="text-honey-600 dark:text-honey-400 hover:underline">Reece Walsh</a></p>
        </footer>
      </main>
    </div>
  );
}

export default App;
