#!/bin/bash
# Setup script for testv2 - creates a working copy of original files

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Setting up testv2 environment..."

# Copy HTML files
echo "Copying HTML files..."
cp "$PROJECT_ROOT/index.html" "$SCRIPT_DIR/"
cp "$PROJECT_ROOT/transport.html" "$SCRIPT_DIR/"
cp "$PROJECT_ROOT/qr.html" "$SCRIPT_DIR/"
cp "$PROJECT_ROOT/payment.html" "$SCRIPT_DIR/"
cp "$PROJECT_ROOT/settings.html" "$SCRIPT_DIR/"

# Copy JS files
echo "Copying JavaScript files..."
cp "$PROJECT_ROOT/index.js" "$SCRIPT_DIR/"

# Copy test directory
echo "Copying test directory..."
if [ -d "$PROJECT_ROOT/test" ]; then
    mkdir -p "$SCRIPT_DIR/test"
    cp -r "$PROJECT_ROOT/test"/* "$SCRIPT_DIR/test/"
else
    echo "Warning: test directory not found in $PROJECT_ROOT/test"
fi

# Copy manifest and service worker
echo "Copying PWA files..."
cp "$PROJECT_ROOT/manifest.json" "$SCRIPT_DIR/"
cp "$PROJECT_ROOT/service-worker.js" "$SCRIPT_DIR/"

# Copy icons directory if exists
if [ -d "$PROJECT_ROOT/icons" ]; then
    echo "Copying icons..."
    cp -r "$PROJECT_ROOT/icons" "$SCRIPT_DIR/"
fi

echo "Setup complete! testv2 is ready."
echo "Original files remain untouched."
