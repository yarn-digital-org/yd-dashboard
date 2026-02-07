'use client';

import { Palette } from 'lucide-react';

export default function BrandingSettingsPage() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Palette className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Branding Settings</h2>
            <p className="text-sm text-gray-500">
              Customize your brand colors and appearance
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-center py-12 text-center">
          <div>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-50 flex items-center justify-center">
              <Palette className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-500 max-w-sm">
              Branding customization including logo upload, color schemes, and 
              email templates will be available in a future update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
