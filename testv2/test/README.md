# Simple SPA Wrapper for Transport App

This directory contains a lightweight iframe-based SPA wrapper that loads the original HTML files without any modifications.

## Structure

```
test/
└── index.html    # Single file - iframe-based SPA wrapper
```

## File Description

### **index.html** (8.2 KB, 207 lines)
- Simple iframe-based SPA wrapper
- Loads original HTML files from parent directory via iframe
- Implements hash-based routing (#transport, #index, #qr, #payment, #settings)
- Intercepts navigation within iframe to use SPA router
- Shows loading indicator during page transitions
- Preserves fullscreen mode during navigation

## How It Works

1. **Iframe Loading**: 
   - Loads original HTML files (../transport.html, ../index.html, etc.) into an iframe
   - No modifications to original files needed
   - Each page maintains its own styling and functionality

2. **Navigation Interception**:
   - Listens for clicks on links and buttons in the iframe
   - Detects navigation to pages like `transport.html`, `index.html`, etc.
   - Intercepts the navigation and uses SPA router instead
   - Sends postMessage from iframe to parent for navigation

3. **Hash-based Routing**:
   - URL updates with hash: `test/index.html#transport`, `test/index.html#qr`, etc.
   - Browser back/forward buttons work correctly
   - Direct navigation via URL hash supported

4. **Fullscreen Preservation**:
   - Fullscreen state is preserved during page transitions
   - No page reloads mean fullscreen is never lost

## Usage

Simply open `test/index.html` in a web browser:
```
file:///path/to/prvtfreebus/test/index.html
```

Or via HTTP server:
```bash
cd /path/to/prvtfreebus
python3 -m http.server 8000
# Then open: http://localhost:8000/test/index.html
```

The app will:
1. Start on the transport page (`#transport`)
2. Load the original transport.html file in iframe
3. Intercept navigation clicks and route through SPA
4. Preserve fullscreen mode during all transitions

## Key Features

- ✅ **No modification** of original HTML files
- ✅ **Single file** SPA implementation
- ✅ **Hash routing** with browser history support
- ✅ **Fullscreen preserved** during navigation
- ✅ **Loading indicator** for smooth transitions
- ✅ **Navigation interception** via event listeners and postMessage

## Advantages Over Template-based SPA

1. **Simplicity**: Only one file (index.html) instead of separate HTML, CSS, and JS files
2. **No modifications**: Original files remain completely untouched
3. **Maintainability**: Changes to original files automatically reflected in SPA
4. **Smaller footprint**: ~8 KB instead of ~80 KB for template-based approach
5. **Easier updates**: No need to sync changes between original and SPA versions

## Notes

- Original files in parent directory remain unchanged
- All features work identically to standalone page version
- Navigation is seamless with no page reloads
- Compatible with all modern browsers supporting iframes and postMessage
