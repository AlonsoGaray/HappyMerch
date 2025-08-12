import React, { useState, useRef, useEffect, useCallback } from "react";
import NavBar from "../components/NavBar";
import { TABS } from "../lib/constants";
import ProductSelector, { type Product } from "../components/ProductSelector";
import ElementSelector from "../components/ElementSelector";
import TextTools from "../components/TextTools";
import CanvasArea from "../components/CanvasArea";
import type { CanvasAreaHandle } from "../components/CanvasArea";
import Tabs from "../components/Tabs";
import type { CanvasItem } from "../types";
import RightSidebar from "../components/RightSidebar";
import { Canvas } from "fabric";
import BgSelector from "../components/BgSelector";
import BottomBar from "../components/BottomBar";
import LeftSidebar from "../components/LeftSideBar";
import { useGlobalData } from "../contexts/AdminDataContext";
import { saveDesignWithFeedback } from "../lib/supabase";
import FeedbackDialog from "../components/FeedbackDialog";
import Done from "../components/Done";

const DEFAULT_SIZE = 60;

type CanvasTextItem = {
  id: number;
  type: "text";
  text: string;
  font: string;
  color: string
  x: number;
  y: number;
};

type CanvasAnyItem = CanvasItem | CanvasTextItem;

// Undo/Redo state management
type CanvasState = {
  canvasItems: CanvasAnyItem[];
  itemStates: { [id: number]: any };
  selectedBgIdx: number;
  productIdx: number;
};

function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

const StepBar: React.FC<{ step: 1 | 2 | 3 }> = ({ step }) => {
  const stepLabels = ['PRODUCTO', 'PERSONALIZA', 'CONFIRMAR'];
  return (
    <div className="flex items-center w-full justify-center gap-8 mt-8 mb-4">
      <button
        className="flex items-center gap-2 font-bold py-2 px-6 rounded shadow focus:outline-none bg-teal-500 text-white"
        disabled
      >
        <span className="flex items-center justify-center w-6 h-6 bg-white text-teal-500 rounded-full font-bold text-sm">{step}</span>
        {stepLabels[step-1]}
      </button>
      <div className={`h-2 w-36 rounded-full ${step === 1 ? 'bg-teal-500' : 'bg-teal-200 opacity-60'}`} />
      <div className={`h-2 w-36 rounded-full ${step === 2 ? 'bg-teal-500' : 'bg-teal-200 opacity-60'}`} />
      <div className={`h-2 w-36 rounded-full ${step === 3 ? 'bg-teal-500' : 'bg-teal-200 opacity-60'}`} />
    </div>
  );
};

const EditPage: React.FC = () => {
  const { data } = useGlobalData();
  const [productIdx, setProductIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("product");
  const [selectedBgIdx, setSelectedBgIdx] = useState(-1);
  
  // Handle background selection with state saving
  const handleBackgroundSelection = (bgIdx: number) => {
    setSelectedBgIdx(bgIdx);
    
    // State will be saved automatically by canvas object:modified event
  };
  const [canvasItems, setCanvasItems] = useState<CanvasAnyItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [itemStates, setItemStates] = useState<{
    [id: number]: {
      x: number;
      y: number;
      size: number;
      rotation: number;
      locked: boolean;
      visible: boolean;
      scaleX: number;
      scaleY: number;
      flipX: boolean;
    };
  }>({});
  const fabricRef = useRef<Canvas | null>(null);
  const canvasAreaRef = useRef<CanvasAreaHandle>(null);
  const [scale, setScale] = useState(1);
  const [showDashedBorder, setShowDashedBorder] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  const [mode, setMode] = useState<'edit' | 'confirm' | 'done'>("edit");
  const [isFeedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false); // Por defecto oculto
  
  // Undo/Redo state management
  const [undoStates, setUndoStates] = useState<CanvasState[]>([]);
  const [activeStateIndex, setActiveStateIndex] = useState(-1);
  const [isRestoring, setIsRestoring] = useState(false);

  const visibleProducts: Product[] = data.products.filter((p: Product) => p.visible);
  const product = visibleProducts[productIdx] || visibleProducts[0];
  const visibleBackgrounds = data.backgrounds.filter((bg: any) => bg.visible);

  // Capture current canvas state
  const captureCanvasState = useCallback((): CanvasState => {
    return {
      canvasItems: [...canvasItems],
      itemStates: { ...itemStates },
      selectedBgIdx,
      productIdx,
    };
  }, [canvasItems, itemStates, selectedBgIdx, productIdx]);

  // Save state to undo history
  const saveState = useCallback(() => {
    if (isRestoring) {
      console.log('⏸️ Skipping state save - currently restoring');
      return; // Don't save while restoring
    }
    
    const stateToSave = captureCanvasState();
    
    console.log('💾 Saving canvas state:', {
      canvasItems: stateToSave.canvasItems.length,
      itemStates: Object.keys(stateToSave.itemStates).length,
      background: stateToSave.selectedBgIdx,
      product: stateToSave.productIdx
    });
    
    setUndoStates(prev => {
      // Remove future states if we're not at the end
      const statesToKeep = prev.slice(0, activeStateIndex + 1);
      
      // Add new state
      const newStates = [...statesToKeep, stateToSave];
      
      // Limit undo history to prevent memory issues (keep last 50 states)
      if (newStates.length > 50) {
        return newStates.slice(-50);
      }
      
      return newStates;
    });
    
    setActiveStateIndex(prev => prev + 1);
    
    console.log('💾 State saved successfully. Total states:', undoStates.length + 1);
  }, [captureCanvasState, activeStateIndex, isRestoring, undoStates.length]);

  // Restore canvas state
  const restoreCanvasState = useCallback((state: CanvasState) => {
    console.log('🔄 Restoring canvas state:', {
      canvasItems: state.canvasItems.length,
      itemStates: Object.keys(state.itemStates).length,
      background: state.selectedBgIdx,
      product: state.productIdx
    });
    
    setIsRestoring(true);
    
    // Temporarily disable canvas events
    if (fabricRef.current) {
      fabricRef.current.off('object:modified');
      fabricRef.current.off('object:added');
      fabricRef.current.off('object:removed');
    }
    
    // Restore state
    setCanvasItems(state.canvasItems);
    setItemStates(state.itemStates);
    setSelectedBgIdx(state.selectedBgIdx);
    setProductIdx(state.productIdx);
    
    // Re-enable canvas events after a short delay
    setTimeout(() => {
      if (fabricRef.current) {
        setupCanvasEventListeners();
      }
      setIsRestoring(false);
      console.log('✅ Canvas state restored successfully');
    }, 100);
  }, []);

  // Undo function
  const handleUndo = useCallback(() => {
    if (activeStateIndex > 0) {
      const previousState = undoStates[activeStateIndex - 2];
      if (previousState) {
        console.log('⬅️ Undo triggered:', {
          fromIndex: activeStateIndex,
          toIndex: activeStateIndex - 1,
          totalStates: undoStates.length
        });
        restoreCanvasState(previousState);
        setActiveStateIndex(activeStateIndex - 1);
      }
    } else {
      console.log('⚠️ Cannot undo: Already at the beginning');
    }
  }, [activeStateIndex, undoStates, restoreCanvasState]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (activeStateIndex < undoStates.length - 1) {
      const nextState = undoStates[activeStateIndex + 1];
      if (nextState) {
        console.log('➡️ Redo triggered:', {
          fromIndex: activeStateIndex,
          toIndex: activeStateIndex + 1,
          totalStates: undoStates.length
        });
        restoreCanvasState(nextState);
        setActiveStateIndex(activeStateIndex + 1);
      }
    } else {
      console.log('⚠️ Cannot redo: Already at the latest state');
    }
  }, [activeStateIndex, undoStates, restoreCanvasState]);

  // Setup canvas event listeners for undo/redo
  const setupCanvasEventListeners = useCallback(() => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    
    console.log('🎯 Setting up canvas event listeners');
    
    // Object modified event - when objects are moved, resized, rotated, etc.
    const handleObjectModified = (e: any) => {
      console.log('🔄 Object modified:', e.target?.type, e.target?.id);
      if (!isRestoring) {
        // Small delay to ensure all modifications are complete
        setTimeout(() => saveState(), 50);
      }
    };
    
    // Object added event - when new objects are added to canvas
    const handleObjectAdded = (e: any) => {
      console.log('➕ Object added:', e.target?.type, e.target?.id);
      if (!isRestoring) {
        setTimeout(() => saveState(), 50);
      }
    };
    
    // Object removed event - when objects are deleted from canvas
    const handleObjectRemoved = (e: any) => {
      console.log('➖ Object removed:', e.target?.type, e.target?.id);
      if (!isRestoring) {
        setTimeout(() => saveState(), 50);
      }
    };
    
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:removed', handleObjectRemoved);
    
    return () => {
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:removed', handleObjectRemoved);
    };
  }, [saveState, isRestoring]);



  // Setup canvas event listeners when fabric canvas is ready
  useEffect(() => {
    if (fabricRef.current && !isRestoring) {
      console.log('🎨 Fabric canvas ready, setting up event listeners');
      const cleanup = setupCanvasEventListeners();
      return cleanup;
    }
  }, [setupCanvasEventListeners, isRestoring]);

  // Initialize undo system with initial state when items are first added
  useEffect(() => {
    if (canvasItems.length > 0 || selectedBgIdx !== -1) {
      const initialState = captureCanvasState();
      if (undoStates.length === 0) {
        console.log('🚀 Initializing undo system with state:', {
          canvasItems: initialState.canvasItems.length,
          itemStates: Object.keys(initialState.itemStates).length,
          background: initialState.selectedBgIdx,
          product: initialState.productIdx
        });
        setUndoStates([initialState]);
        setActiveStateIndex(0);
        console.log('✅ Undo system initialized with index 0');
      }
    }
  }, [canvasItems.length, selectedBgIdx, undoStates.length, captureCanvasState]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'z' && e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);


  const handleAddElement = (element: {
    id: string;
    name: string;
    url: string;
    visible: boolean;
  }) => {
    const newId = Date.now();
    const centerX = product.width / 2;
    const centerY = product.height / 2;
    setCanvasItems((items) => [
      ...items,
      {
        id: newId,
        src: element.url,
        x: centerX,
        y: centerY,
      },
    ]);
    setSelectedId(newId);
    setItemStates((states) => ({
      ...states,
      [newId]: {
        x: centerX,
        y: centerY,
        size: DEFAULT_SIZE,
        rotation: 0,
        locked: false,
        visible: true,
        scaleX: 0.5,
        scaleY: 0.5,
        flipX: false,
      },
    }));
    
    // State will be saved automatically by canvas object:added event
  };

  const handleDeleteItem = (id: number) => {
    setCanvasItems((items) => items.filter((item) => item.id !== id));
    
    // State will be saved automatically by canvas object:removed event
  };

  const handleRotate = (id: number, angleIncrement: number) => {
    canvasAreaRef.current?.rotateItem(id, angleIncrement);
    
    // State will be saved automatically by canvas object:modified event
  };
  const handleFlipX = (id: number) => {
    canvasAreaRef.current?.flipItem(id);
    
    // State will be saved automatically by canvas object:modified event
  };
  const handleResize = (id: number, factor: number) => {
    canvasAreaRef.current?.resizeItem(id, factor);
    
    // State will be saved automatically by canvas object:modified event
  };
  const handleLockToggle = (id: number) => {
    canvasAreaRef.current?.lockItem(id);
    
    // State will be saved automatically by canvas object:modified event
  };
  const isLocked = (id: number) => !!itemStates[id]?.locked;

  const handleAddText = (text: string, font: string, color: string) => {
    const newId = Date.now();
    const centerX = product.width / 2;
    const centerY = product.height / 2;
    setCanvasItems((items) => [
      ...items,
      {
        id: newId,
        type: "text",
        text,
        font,
        color,
        x: centerX,
        y: centerY,
      },
    ]);
    setSelectedId(newId);
    
    // State will be saved automatically by canvas object:added event
  };

  const handleUpdateTextItem = (id: number, changes: Partial<{ font: string; color: string }>) => {
    setCanvasItems((items) =>
      items.map((item) => {
        if (item.id === id && (item as any).type === "text") {
          return { ...item, ...changes };
        }
        return item;
      })
    );
    const fabricCanvas = fabricRef.current;
    if (fabricCanvas) {
      const obj = fabricCanvas.getObjects().find((o) => (o as any).id === id);
      if (obj && changes.font) {
        let fontFamily = "inherit";
        if (changes.font === "font-sans") {
          fontFamily = "sans-serif";
        } else if (changes.font === "font-serif") {
          fontFamily = "serif";
        } else if (changes.font === "font-mono") {
          fontFamily = "monospace";
        }
        obj.set("fontFamily", fontFamily);
      }
      if (obj && changes.color) obj.set("fill", changes.color);
      fabricCanvas.renderAll();
    }
    
    // State will be saved automatically by canvas object:modified event
  };

  const handleToggleVisible = (id: number) => {
    setItemStates((states) => ({
      ...states,
      [id]: {
        ...states[id],
        visible: !states[id]?.visible,
      },
    }));
    
    // State will be saved automatically by canvas object:modified event
  };
  const isVisible = useCallback((id: number) => itemStates[id]?.visible !== false, [itemStates]);

  const handleReorderItems = (newOrder: CanvasAnyItem[]) => {
    setCanvasItems(newOrder);
    
    // State will be saved automatically by canvas object:modified event
  };
  const handleAlign = (id: number, position: string) => {
    if (product) {
      canvasAreaRef.current?.alignItem(id, position, product);
      
      // State will be saved automatically by canvas object:modified event
    }
    
  };

  const handleSave = async (feedbackData: {
    name: string;
    email: string;
    comment: string;
    rating: number;
  }) => {
    if (!fabricRef.current) return;
    try {
      const canvas = fabricRef.current;
      const dataUrl = canvas.toDataURL({ multiplier: 2 });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await saveDesignWithFeedback(blob, feedbackData);
      setFeedbackDialogOpen(false);
      setMode("done");
    } catch (error: any) {
      console.error("Error al guardar:", error);
      if (
        typeof error?.message === "string" &&
        error.message.includes("The resource already exists")
      ) {
        alert("Ya existe un diseño con ese correo. Por favor, usa otro correo.");
      } else {
        const fabricCanvas = fabricRef.current;
        if (fabricCanvas) {
          fabricCanvas.getObjects().forEach((obj) => {
            if (obj.type === "image" && "getSrc" in obj) {
              console.log("Imagen en canvas:", (obj as any).getSrc());
            }
          });
        }
        alert("Hubo un error al guardar tu diseño. Por favor, intenta de nuevo.");
      }
    }
  };
  const handleNavBarSave = () => {
    setShowDashedBorder(false);
    setShowLayers(false);
    setMode("confirm");
    setSelectedId(null);
  };
  const handleEditAgain = () => {
    setShowDashedBorder(true);
    setShowLayers(true);
    setMode("edit");
  };
  const handleSendDesign = () => {
    setFeedbackDialogOpen(true);
  };

  const handleZoom = (factor: number) => {
    let newScale = scale * factor;
    const minScale = 0.1;
    if (newScale < minScale) newScale = minScale;
    setScale(newScale);
  };

  useEffect(() => {
    setItemStates((prev) => {
      const updated = { ...prev };
      let changed = false;
      canvasItems.forEach((item) => {
        if (!updated[item.id]) {
          updated[item.id] = {
            x: (item as any).x,
            y: (item as any).y,
            size: DEFAULT_SIZE,
            rotation: 0,
            locked: false,
            visible: true,
            scaleX: 1,
            scaleY: 1,
            flipX: false,
          };
          changed = true;
        } else {
          if (updated[item.id].scaleX === undefined) {
            updated[item.id].scaleX = 1;
            changed = true;
          }
          if (updated[item.id].scaleY === undefined) {
            updated[item.id].scaleY = 1;
            changed = true;
          }
          if (updated[item.id].flipX === undefined) {
            updated[item.id].flipX = false;
            changed = true;
          }
        }
      });
      return changed ? updated : prev;
    });
  }, [canvasItems, setItemStates]);

  useEffect(() => {
    if (selectedId !== null && fabricRef.current) {
      const obj = fabricRef.current.getObjects().find((o) => (o as any).id === selectedId);
      if (obj && itemStates[selectedId] && obj.flipX !== itemStates[selectedId].flipX) {
        obj.set("flipX", itemStates[selectedId].flipX);
        fabricRef.current.renderAll();
      }
    }
  }, [selectedId, itemStates, fabricRef]);

  return (
    <div className="min-h-dvh flex flex-col max-h-dvh items-center" style={{ background: mode === "done" ? data.config?.main_color : "#f3f4f6" }}>
      {mode === "edit" && (
        <div className="w-full absolute top-14 z-30">
          <StepBar step={canvasItems.length === 0 && selectedBgIdx === -1 ? 1 : 2} />
        </div>
      )}
      {mode === "confirm" && (
        <div className="w-full absolute top-28">
          <StepBar step={3} />
        </div>
      )}
      {mode === "edit" ? (
        <>
          {console.log('🔍 NavBar Debug:', {
            activeStateIndex,
            undoStatesLength: undoStates.length,
            canUndo: activeStateIndex > 0,
            canRedo: activeStateIndex < undoStates.length - 1,
            canvasItemsLength: canvasItems.length,
            selectedBgIdx
          })}
          <NavBar 
            onSave={handleNavBarSave} 
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={activeStateIndex > 0}
            canRedo={activeStateIndex < undoStates.length - 1}
          />
        </>
      ) : mode === "confirm" ? (
        <div className="flex flex-col w-full p-14">
          <div className="flex gap-6">
            <img className="h-fit max-h-12" src="/Logo.svg" alt="logo" />
            {data.config?.logo_url && (
              <img className="h-fit max-h-12" src={data.config.logo_url} alt="logo marca" />
            )}
          </div>
        </div>
      ) : null}
      <div className={`flex-grow flex relative w-full justify-center items-center overflow-hidden ${mode === "done" && "flex-col"}`}>
        {mode === "edit" && (
          <LeftSidebar
            selectedId={selectedId}
            onRotate={handleRotate}
            onResize={handleResize}
            onAlign={handleAlign}
            onFlipX={handleFlipX}
          />
        )}
          <div className="flex flex-col w-full h-full justify-center items-center gap-5 overflow-auto">
            <CanvasArea
              ref={canvasAreaRef}
              product={product}
              items={canvasItems}
              selectedId={mode === "edit" ? selectedId : null}
              setSelectedId={setSelectedId}
              fabricRef={fabricRef}
              scale={scale}
              selectedBg={selectedBgIdx >= 0 && selectedBgIdx < visibleBackgrounds.length ? visibleBackgrounds[selectedBgIdx] : null}
              onUpdateItems={setCanvasItems}
              showDashedBorder={showDashedBorder && mode === "edit"}
              isVisible={isVisible}
              setItemStates={setItemStates}
              readOnly={mode !== "edit"}
            />
            {mode === "edit" && (
              <BottomBar
                selectedId={selectedId}
                onToggleDashedBorder={() => setShowDashedBorder((v) => !v)}
                onToggleLayers={() => setShowLayers((v) => !v)}
                onZoom={handleZoom}
              />
            )}
          </div>
        {mode === "edit" && showLayers && (
          <RightSidebar
            selectedId={selectedId}
            canvasItems={canvasItems}
            setSelectedId={setSelectedId}
            onDeleteItem={handleDeleteItem}
            onLockToggle={handleLockToggle}
            isLocked={isLocked}
            onToggleVisible={handleToggleVisible}
            isVisible={isVisible}
            onReorderItems={handleReorderItems}
          />
        )}
        {mode === "done" && (
          <Done titleFont={data.config?.welcome_title_font} subtitleFont={data.config?.welcome_subtitle_font} />
        )}
      </div>
      {mode === "edit" && (
        <div
          className={`relative w-full pt-2 px-4 pb-2 flex flex-col max-w-11/12 overflow-visible rounded-xl scroll`}
          style={{ backgroundColor: data.config?.main_color }}
        >
          <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          {activeTab === "product" && <ProductSelector onSelect={setProductIdx} />}
          {activeTab === "fondos" && <BgSelector onSelect={handleBackgroundSelection} />}
          {activeTab === "elements" && <ElementSelector onSelect={handleAddElement} />}
          {activeTab === "text" && (
            <TextTools
              onAddText={handleAddText}
              selectedTextItem={
                canvasItems.find((i) => i.id === selectedId && (i as any).type === "text") as
                  | CanvasTextItem
                  | undefined
              }
              onUpdateTextItem={handleUpdateTextItem}
            />
          )}
        </div>
      )}
      {mode === "confirm" && (
        <>
          <div className="fixed right-8 top-1/2 transform -translate-y-1/2 flex flex-col items-end z-50">
            {/* Globo de mensaje */}
            {showBubble && (
              <div className="relative">
                <div className="absolute z-50">
                  <button
                    className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-lg font-bold shadow focus:outline-none"
                    onClick={() => setShowBubble(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="bg-white border border-black rounded-full px-5 py-4 text-center max-w-[140px] min-w-[120px] relative flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
                  <span className="block text-xs font-bold leading-tight">¡QUEDÓ<br/>INCREÍBLE!<br/><span className="font-black">YA QUEREMOS<br/>VERLO</span></span>
                </div>
              </div>
            )}
            {/* Círculo teal con carita desde SVG */}
            <div className="w-16 h-16 flex items-center justify-center cursor-pointer" onClick={() => setShowBubble(true)}>
              <img src="/happy_face.svg" alt="Carita feliz" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center w-full pb-28 gap-10">
            <h2 className="text-4xl font-bold text-center" style={{ color: data.config?.main_color }}>¡A UN PASO DE SER TUYO!</h2>
            <p className="text-center text-xl max-w-xl">
              Revisa los detalles finales, confirma tu creación y prepárate para recibir tu merch personalizado.
            </p>
            <div className="flex gap-4 mb-6">
              <button
                className="font-bold py-2 px-4 rounded"
                style={{
                  backgroundColor: data.config?.main_color ? hexToRgba(data.config.main_color, 0.5) : 'rgba(0,0,0,0.1)',
                  color: data.config?.main_color || '#222',
                }}
                onClick={handleEditAgain}
              >
                EDITAR DISEÑO
              </button>
              <button
                className="text-white font-bold py-2 px-4 rounded" style={{ backgroundColor: data.config?.main_color }}
                onClick={handleSendDesign}
              >
                ENVIAR DISEÑO
              </button>
            </div>
          </div>
        </>
      )}
      {mode !== "done" && (
        <FeedbackDialog
          isOpen={isFeedbackDialogOpen}
          onClose={() => setFeedbackDialogOpen(false)}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
};

export default EditPage;
