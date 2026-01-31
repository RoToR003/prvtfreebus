# Testing Guide for Iframe-based SPA Wrapper

## How to Test

1. **Open the Application**
   - Open `test/index.html` in a modern web browser
   - Or use HTTP server: `python3 -m http.server 8000` then open `http://localhost:8000/test/index.html`
   - The app should start on the Transport page

2. **Test Navigation**
   - Click "Міський транспорт" → Should navigate to Archive page (#index)
   - Click "Літак" → Should navigate to Settings page (#settings)
   - Click back button → Should return to Transport page
   - Use browser back/forward buttons → Should navigate correctly
   - Watch the loading indicator appear briefly during transitions

3. **Test Hash Routing**
   - URL should update with hash: `test/index.html#transport`, `test/index.html#qr`, etc.
   - Try entering URL directly: `test/index.html#payment` → Should load payment page
   - Refresh browser → Should stay on current page

4. **Test QR Scanner**
   - From Archive page, click "Відсканувати QR-код" button
   - Camera should start (permission required)
   - Navigation from QR page should stop camera
   - Click X button → Should return to Archive page

5. **Test Payment Page**
   - Navigate to Transport → Міський транспорт → Settings → Back to transport → Міський транспорт → Archive → Go to QR → Back to archive
   - All transitions should be smooth without page reloads
   - Test quantity controls (+/-) and other interactive elements

6. **Test Fullscreen**
   - Enter fullscreen mode (F11 or double-click)
   - Navigate between pages → Should stay fullscreen
   - Fullscreen should be preserved during all transitions

## Expected Behavior

### Navigation
- ✅ No page reloads
- ✅ Instant page transitions with brief loading indicator
- ✅ URL hash updates (#transport, #index, etc.)
- ✅ Browser history works correctly
- ✅ Fullscreen preserved during navigation
- ✅ Original HTML files loaded in iframe

### Content Loading
- ✅ Pages load from parent directory (../transport.html, etc.)
- ✅ All original styling preserved
- ✅ All original functionality works
- ✅ No modifications to original files needed

### Iframe Behavior
- ✅ Iframe fills entire viewport
- ✅ No borders or scrollbars on iframe
- ✅ Navigation clicks intercepted properly
- ✅ postMessage communication works between iframe and parent

## Differences from Original Multi-page Version

### Advantages
1. **Fullscreen Preservation**: Unlike multi-page version, fullscreen never breaks
2. **Faster Navigation**: No page reloads mean instant transitions
3. **Browser History**: Back/forward buttons work more predictably
4. **Single Entry Point**: Only need to open one file

### Potential Issues
1. **Same-origin Policy**: Must be served via HTTP for full functionality
   - File protocol (file://) may have iframe restrictions
   - Use HTTP server for best results
2. **Navigation Interception**: Some navigation methods may not be caught
   - Direct `window.location` assignments in iframe are intercepted
   - `window.history.back()` may cause issues if not properly handled

## Troubleshooting

### Pages Not Loading
- **Check**: Are you using HTTP server or file:// protocol?
- **Solution**: Use HTTP server: `python3 -m http.server 8000`
- **Check**: Browser console for CORS or iframe errors

### Navigation Not Working
- **Check**: Browser console for JavaScript errors
- **Check**: Is navigation interception working? (Check console logs)
- **Try**: Refresh the page and try again

### Content Not Visible
- **Check**: Is iframe loading? (Check browser dev tools)
- **Check**: Are original HTML files in parent directory?
- **Solution**: Ensure file paths are correct (../transport.html, etc.)

### Fullscreen Issues
- **Check**: Browser permissions for fullscreen
- **Try**: Use F11 or browser fullscreen option
- **Note**: Some browsers may exit fullscreen on certain actions

## Browser Compatibility

Tested on:
- ✅ Chrome/Edge (Chromium) - Full support
- ✅ Firefox - Full support
- ✅ Safari (desktop) - Full support
- ✅ Mobile browsers (Chrome, Safari) - Full support

Requires:
- ES6+ JavaScript support (Proxy, arrow functions, const/let)
- iframe support
- postMessage API
- History API (hash routing)
- Modern event listeners (addEventListener)
