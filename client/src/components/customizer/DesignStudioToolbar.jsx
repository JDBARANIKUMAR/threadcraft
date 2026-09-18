import React, { useState } from 'react';
import {
  Upload,
  Type,
  Palette,
  Layers,
  Sparkles,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RotateCw,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Smile,
  AlertCircle,
  Plus,
  Bookmark,
  CheckCircle2
} from 'lucide-react';
import DesignLibraryPanel from './DesignLibraryPanel';

// Clean Font List
export const DESIGN_FONTS = [
  { id: 'outfit', name: 'Outfit (Modern)', family: "'Outfit', sans-serif" },
  { id: 'inter', name: 'Inter (Clean)', family: "'Plus Jakarta Sans', sans-serif" },
  { id: 'bebas', name: 'Bebas (Streetwear)', family: "'Impact', sans-serif" },
  { id: 'serif', name: 'Playfair (Classic)', family: "'Georgia', serif" },
  { id: 'script', name: 'Brush (Handwritten)', family: "'Brush Script MT', cursive" },
  { id: 'mono', name: 'Tech (Monospace)', family: "'Courier New', monospace" },
];

// Preset Text Colors (UI styling constants, not business data)
export const PRESET_COLORS = [
  '#ffffff', '#000000', '#f59e0b', '#ef4444', '#10b981',
  '#3b82f6', '#8b5cf6', '#ec4899', '#facc15', '#06b6d4'
];

const DesignStudioToolbar = ({
  activeTab,
  setActiveTab,
  view,
  onToggleView,
  elements = [],
  selectedId = null,
  onAddImage = () => {},
  onAddText = () => {},
  onUpdateElement = () => {},
  onDeleteElement = () => {},
  onMoveLayer = () => {},
  onUndo = () => {},
  onRedo = () => {},
  canUndo = false,
  canRedo = false,
  onClearAll = () => {},
  onSaveDesign = () => {},
  designs = [], // DB design library fetched by the parent page
}) => {
  const [textInput, setTextInput] = useState('');
  const [selectedFont, setSelectedFont] = useState(DESIGN_FONTS[0].family);
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(24);
  const [isBold, setIsBold] = useState(true);
  const [isItalic, setIsItalic] = useState(false);
  const [alignment, setAlignment] = useState('center');
  const [isCurved, setIsCurved] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadWarning, setUploadWarning] = useState('');

  const selectedElement = elements.find((el) => el.id === selectedId);

  // File Upload Handler (Max 10MB, JPG/PNG/SVG)
  const handleFileChange = (e) => {
    setUploadError('');
    setUploadWarning('');

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const isLowRes = img.naturalWidth < 300 || img.naturalHeight < 300;
        if (isLowRes) {
          setUploadWarning('Image is under 300px resolution — may appear slightly blurry when printed.');
        }
        onAddImage({
          url: event.target.result,
          name: file.name,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          lowResWarning: isLowRes
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Submit Text Handler
  const handleCreateText = (e) => {
    e?.preventDefault();
    if (!textInput.trim()) return;

    onAddText({
      text: textInput.trim(),
      fontFamily: selectedFont,
      color: selectedColor,
      fontSize: fontSize,
      bold: isBold,
      italic: isItalic,
      align: alignment,
      isCurved: isCurved,
    });
    setTextInput('');
  };

  return (
    <div className="flex flex-col h-full bg-ink-950 border border-line rounded-sm overflow-hidden shadow-xl">
      {/* Top Header: View Toggle & Main Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-canvasd">
        <div className="flex items-center gap-1.5 p-1 bg-ink-950 rounded-sm border border-line">
          <button
            type="button"
            onClick={() => onToggleView('front')}
            className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-all ${
              view === 'front' ? 'bg-ink-900 text-ink-900 shadow-md' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            Front View
          </button>
          <button
            type="button"
            onClick={() => onToggleView('back')}
            className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-all ${
              view === 'back' ? 'bg-ink-900 text-ink-900 shadow-md' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            Back View
          </button>
        </div>

        {/* Undo / Redo / Clear */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-ink-500 hover:text-ink-900 disabled:opacity-30 rounded-sm hover:bg-canvasd transition"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-ink-500 hover:text-ink-900 disabled:opacity-30 rounded-sm hover:bg-canvasd transition"
            title="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="px-2 py-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 rounded-sm hover:bg-rose-950/40 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-line bg-white/40 px-2 pt-2 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'upload'
              ? 'border-ink-900 text-ink-900'
              : 'border-transparent text-ink-500 hover:text-ink-900'
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Upload Image
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'text'
              ? 'border-ink-900 text-ink-900'
              : 'border-transparent text-ink-500 hover:text-ink-900'
          }`}
        >
          <Type className="w-3.5 h-3.5" /> Add Text
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'presets'
              ? 'border-ink-900 text-ink-900'
              : 'border-transparent text-ink-500 hover:text-ink-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Graphics
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('layers')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'layers'
              ? 'border-ink-900 text-ink-900'
              : 'border-transparent text-ink-500 hover:text-ink-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Layers ({elements.length})
        </button>
      </div>

      {/* Tab Panels Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* --- TAB 1: UPLOAD IMAGE --- */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-line hover:border-ink-900 rounded-sm cursor-pointer bg-canvasd hover:bg-white transition-all group">
              <Upload className="w-7 h-7 text-ink-500 group-hover:text-ink-700 transition-colors mb-2" />
              <span className="text-xs font-bold text-ink-900">Click to Upload Image / Logo</span>
              <span className="text-[10px] text-ink-400 mt-0.5">Supports PNG, JPG, SVG (Max 10MB)</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {uploadError && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadWarning && (
              <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/50 p-2.5 rounded-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadWarning}</span>
              </div>
            )}

            <div className="rounded-sm border border-line p-3 bg-white/40">
              <p className="text-[11px] font-semibold text-ink-700 flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-ink-700" /> Print Quality Tip:
              </p>
              <p className="text-[10px] text-ink-500 leading-relaxed">
                High-contrast PNG images with transparent backgrounds yield the crispest print results on t-shirts.
              </p>
            </div>
          </div>
        )}

        {/* --- TAB 2: ADD TEXT --- */}
        {activeTab === 'text' && (
          <form onSubmit={handleCreateText} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1">Your Custom Text</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="e.g. STREETWEAR '26"
                  className="flex-1 rounded-sm border border-line bg-white px-3 py-2 text-xs text-ink-900 placeholder-ink-400 outline-none focus:border-ink-900"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="px-3 py-2 bg-ink-900 hover:bg-ink-700 disabled:opacity-40 text-ink-900 font-bold text-xs rounded-sm flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Font Picker */}
            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1">Font Style</label>
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="w-full rounded-sm border border-line bg-white px-3 py-2 text-xs text-ink-900 outline-none focus:border-ink-900"
              >
                {DESIGN_FONTS.map((f) => (
                  <option key={f.id} value={f.family}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size & Curved Switch */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Size ({fontSize}px)</label>
                <input
                  type="range"
                  min="14"
                  max="64"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-ink-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Arc / Curved</label>
                <button
                  type="button"
                  onClick={() => setIsCurved(!isCurved)}
                  className={`w-full py-1.5 px-3 text-xs font-bold rounded-sm border transition-all ${
                    isCurved
                      ? 'bg-canvasd border-ink-900 text-ink-900'
                      : 'bg-white border-line text-ink-500'
                  }`}
                >
                  {isCurved ? '🌀 Curved ON' : 'Straight Line'}
                </button>
              </div>
            </div>

            {/* Styling Toggles & Colors */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ink-700">Format & Color</label>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-white border border-line p-1 rounded-sm">
                  <button
                    type="button"
                    onClick={() => setIsBold(!isBold)}
                    className={`p-1.5 rounded-sm text-xs transition ${
                      isBold ? 'bg-ink-900 text-ink-900' : 'text-ink-500 hover:text-ink-900'
                    }`}
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsItalic(!isItalic)}
                    className={`p-1.5 rounded-sm text-xs transition ${
                      isItalic ? 'bg-ink-900 text-ink-900' : 'text-ink-500 hover:text-ink-900'
                    }`}
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-white border border-line p-1 rounded-sm">
                  <button
                    type="button"
                    onClick={() => setAlignment('left')}
                    className={`p-1.5 rounded-sm text-xs transition ${
                      alignment === 'left' ? 'bg-ink-900 text-ink-900' : 'text-ink-500 hover:text-ink-900'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlignment('center')}
                    className={`p-1.5 rounded-sm text-xs transition ${
                      alignment === 'center' ? 'bg-ink-900 text-ink-900' : 'text-ink-500 hover:text-ink-900'
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlignment('right')}
                    className={`p-1.5 rounded-sm text-xs transition ${
                      alignment === 'right' ? 'bg-ink-900 text-ink-900' : 'text-ink-500 hover:text-ink-900'
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Custom Color Wheel */}
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-8 h-8 rounded-sm border border-line bg-transparent cursor-pointer"
                  title="Pick custom color"
                />
              </div>

              {/* Swatch Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      selectedColor === c ? 'scale-110 border-ink-900 ring-2 ring-ink-900/50' : 'border-line '
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </form>
        )}

        {/* --- TAB 3: GRAPHICS & STICKERS --- */}
        {activeTab === 'presets' && <DesignLibraryPanel designs={designs} onAddImage={onAddImage} />}

        {/* --- TAB 4: LAYERS MANAGER --- */}
        {activeTab === 'layers' && (
          <div className="space-y-3">
            {elements.length === 0 ? (
              <p className="text-xs text-ink-400 text-center py-6">No design elements on {view} view yet.</p>
            ) : (
              elements.map((el, index) => {
                const isSelected = el.id === selectedId;
                return (
                  <div
                    key={el.id}
                    onClick={() => onMoveLayer(el.id, 'select')}
                    className={`flex items-center justify-between p-2.5 rounded-sm border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-canvas border-ink-900 text-ink-900'
                        : 'bg-canvasd border-line text-ink-700 hover:bg-canvasd'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs text-ink-400">#{index + 1}</span>
                      <span className="text-xs font-medium truncate">
                        {el.type === 'text' ? `Text: "${el.text}"` : `Image: ${el.name || 'Upload'}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveLayer(el.id, 'up');
                        }}
                        className="p-1 text-ink-500 hover:text-ink-900 rounded"
                        title="Bring Forward"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveLayer(el.id, 'down');
                        }}
                        className="p-1 text-ink-500 hover:text-ink-900 rounded"
                        title="Send Backward"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteElement(el.id);
                        }}
                        className="p-1 text-rose-400 hover:text-rose-300 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer: Save Design Option */}
      <div className="p-3 border-t border-line bg-canvasd flex items-center justify-between">
        <button
          type="button"
          onClick={onSaveDesign}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:text-ink-900 bg-canvasd hover:bg-ink-200 rounded-sm transition-all"
        >
          <Bookmark className="w-3.5 h-3.5 text-ink-700" /> Save Design
        </button>
        <span className="text-[10px] text-ink-400">Auto-saves to browser</span>
      </div>
    </div>
  );
};

export default DesignStudioToolbar;
