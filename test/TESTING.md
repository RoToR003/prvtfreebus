# Testing Guide for SPA Version

## How to Test

1. **Open the Application**
   - Open `test/index.html` in a modern web browser
   - The app should start on the Transport page

2. **Test Navigation**
   - Click "Міський транспорт" → Should navigate to Archive page (#index)
   - Click "Літак" → Should navigate to Settings page (#settings)
   - Click back button → Should return to Transport page
   - Use browser back/forward buttons → Should navigate correctly

3. **Test QR Scanner**
   - From Archive page, click "Відсканувати QR-код" button
   - Camera should start (permission required)
   - Camera quality should be high (4096x2160, 60fps if supported)
   - Click X button → Should return to Archive page
   - Click lightning button → Should navigate to Payment page

4. **Test Payment Page**
   - From QR page, click lightning button
   - Quantity controls (+/-) should work
   - Total price should update correctly
   - Enter transport number → Should accept only digits
   - Click "Купити" → Should create ticket and navigate to Archive

5. **Test Archive Page**
   - Should display all saved tickets
   - Active tickets should show countdown timer
   - Expired tickets should appear grayed out
   - Click info icon → Should open modal with company details
   - Modal should close properly

6. **Test Settings Page**
   - Statistics should display correctly
   - Toggle "Локальне збереження" → Should work
   - "Очистити історію" → Should show confirmation modal
   - "Очистити кеш" → Should work
   - "Вибір камери" → Should show available cameras

7. **Test Fullscreen**
   - Double-click on empty space → Should toggle fullscreen
   - Navigate between pages in fullscreen → Should stay fullscreen
   - Exit fullscreen manually → Should remember state

## Expected Behavior

### Navigation
- ✅ No page reloads
- ✅ Instant page transitions
- ✅ URL hash updates (#transport, #index, etc.)
- ✅ Browser history works
- ✅ Fullscreen preserved during navigation

### QR Camera
- ✅ Starts automatically on QR page
- ✅ Stops when leaving QR page
- ✅ High quality (4096x2160, 60fps if supported)
- ✅ Camera switch works

### Tickets
- ✅ Countdown timers work correctly
- ✅ Expired tickets show properly
- ✅ LocalStorage persistence works
- ✅ Multiple serial numbers for multiple passengers

### Styling
- ✅ All pages styled correctly
- ✅ No visual glitches during transitions
- ✅ Responsive design works

## Known Limitations

1. **QR Scanning**: Actual QR code detection depends on jsQR library being loaded properly
2. **Camera Quality**: High quality settings (4096x2160, 60fps) may fallback to lower quality on unsupported devices
3. **LocalStorage**: If disabled in browser, tickets won't persist

## Troubleshooting

### Camera Not Working
- Check browser permissions
- Try different browser
- Check console for errors

### Navigation Not Working
- Check console for JavaScript errors
- Verify all templates are loaded
- Check that jsQR loaded before app.js

### Timers Not Updating
- Check if JavaScript is running
- Look for errors in console
- Verify displayTicketsOnIndexPage is called

## Browser Compatibility

Tested on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (desktop)
- ✅ Mobile browsers (Chrome, Safari)

Requires:
- ES6+ JavaScript support
- MediaDevices API (for camera)
- LocalStorage
- Template element support
- History API
