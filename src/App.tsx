/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { Navigation } from './components/Navigation.tsx';
import { AuthView } from './components/auth/AuthView.tsx';
import { DriverDashboard } from './components/driver/DriverDashboard.tsx';
import { GpsRiskMap } from './components/driver/GpsRiskMap.tsx';
import { CommandCenter } from './components/driver/CommandCenter.tsx';
import { CommunityView } from './components/driver/CommunityView.tsx';
import { DriverAppointmentsView } from './components/driver/DriverAppointmentsView.tsx';
import { WorkshopView } from './components/workshop/WorkshopView.tsx';
import { CmsAdminView } from './components/cms/CmsAdminView.tsx';
import { SuperAdminView } from './components/superadmin/SuperAdminView.tsx';
import { JwtInspectorModal } from './components/JwtInspectorModal.tsx';
import { NotificationDrawer } from './components/NotificationDrawer.tsx';
import { AiAssistantModal } from './components/AiAssistantModal.tsx';
import { AccessDeniedView } from './components/AccessDeniedView.tsx';

const AppContent: React.FC = () => {
  const { user, activeRole, activeTab, isAuditorMode } = useApp();

  // If unauthenticated, show AuthView
  if (!user) {
    return <AuthView />;
  }

  // Determine what view to render based on activeTab and activeRole
  const renderActiveView = () => {
    // 1. DRIVER Views
    if (activeTab === 'dashboard') {
      return <DriverDashboard initialTab="telemetry" />;
    }
    if (activeTab === 'maintenance_logs') {
      return <DriverDashboard initialTab="maintenance" />;
    }
    if (activeTab === 'map') {
      return <GpsRiskMap />;
    }
    if (activeTab === 'commands') {
      return <CommandCenter />;
    }
    if (activeTab === 'community') {
      return <CommunityView />;
    }
    if (activeTab === 'appointments') {
      return <DriverAppointmentsView />;
    }

    // 2. WORKSHOP_OWNER Views
    if (
      activeTab === 'workshop' ||
      activeTab === 'workshop_appointments' ||
      activeTab === 'workshop_anti_fraud' ||
      activeTab === 'workshop_offers' ||
      activeTab === 'workshop_news'
    ) {
      if (activeRole !== 'WORKSHOP_OWNER' && activeRole !== 'SUPER_ADMIN' && !isAuditorMode) {
        return <AccessDeniedView requiredRoles={['WORKSHOP_OWNER', 'SUPER_ADMIN']} />;
      }
      return <WorkshopView />;
    }

    // 3. CMS Views (ADMIN or SUPER_ADMIN)
    if (
      activeTab === 'cms_articles' ||
      activeTab === 'cms_moderation' ||
      activeTab === 'cms_diy' ||
      activeTab === 'cms_analytics'
    ) {
      if (activeRole !== 'ADMIN' && activeRole !== 'SUPER_ADMIN') {
        return <AccessDeniedView requiredRoles={['ADMIN', 'SUPER_ADMIN']} />;
      }
      return <CmsAdminView />;
    }

    // 4. SUPER_ADMIN Views
    if (
      activeTab === 'super_admin' ||
      activeTab === 'super_team' ||
      activeTab === 'super_audit' ||
      activeTab === 'super_workshops' ||
      activeTab === 'super_trash' ||
      activeTab === 'super_timeline'
    ) {
      if (activeRole !== 'SUPER_ADMIN') {
        return <AccessDeniedView requiredRoles={['SUPER_ADMIN']} />;
      }
      return <SuperAdminView />;
    }

    // Fallback default
    return <DriverDashboard />;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col antialiased">
      <Header />
      <Navigation />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderActiveView()}
      </main>

      {/* Global Modals & Drawers */}
      <JwtInspectorModal />
      <NotificationDrawer />
      <AiAssistantModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
