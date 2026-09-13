import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { Patient, TherapySession } from './types';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { FloatingWhatsApp } from './components/layout/FloatingWhatsApp';
import { ToastContainer } from './components/common/ToastContainer';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';

// Views
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { PatientListView } from './components/patients/PatientListView';
import { PatientDetailView } from './components/patients/PatientDetailView';
import { TherapyListView } from './components/therapy/TherapyListView';
import { SalesView } from './components/sales/SalesView';
import { InvoiceListView } from './components/invoices/InvoiceListView';
import { ServicesView } from './components/services/ServicesView';
import { HerbalProductsView } from './components/herbal/HerbalProductsView';
import { FinanceView } from './components/finance/FinanceView';
import { FinancialReportView } from './components/reports/FinancialReportView';
import { ClinicalReportsView } from './components/reports/ClinicalReportsView';
import { ImportExportView } from './components/importExport/ImportExportView';
import { SettingsView } from './components/settings/SettingsView';

// Modals
import { PatientFormModal } from './components/patients/PatientFormModal';
import { TherapyFormModal } from './components/therapy/TherapyFormModal';

const ClinicAppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const { isGlobalSearchOpen, setIsGlobalSearchOpen, patients } = useClinic();

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Modals & Target States
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);

  const [isTherapyModalOpen, setIsTherapyModalOpen] = useState(false);
  const [therapyToEdit, setTherapyToEdit] = useState<TherapySession | null>(null);
  const [therapyTargetPatientId, setTherapyTargetPatientId] = useState<string | undefined>(undefined);

  const [salesPreselectedPatientId, setSalesPreselectedPatientId] = useState<string | undefined>(undefined);

  // If not logged in, render authentication screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center">
        <LoginView />
        <ToastContainer />
      </div>
    );
  }

  const handleNavigate = (tab: string, itemId?: string) => {
    setActiveTab(tab);
    if (tab === 'patients' && itemId) {
      setSelectedPatientId(itemId);
    } else if (tab !== 'patients') {
      setSelectedPatientId(null);
    }
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('patients');
  };

  const handleOpenAddPatient = () => {
    setPatientToEdit(null);
    setIsPatientModalOpen(true);
  };

  const handleOpenEditPatient = (patient: Patient) => {
    setPatientToEdit(patient);
    setIsPatientModalOpen(true);
  };

  const handleOpenNewTherapy = (patientId?: string) => {
    setTherapyToEdit(null);
    setTherapyTargetPatientId(patientId);
    setIsTherapyModalOpen(true);
  };

  const handleOpenEditTherapy = (session: TherapySession) => {
    setTherapyToEdit(session);
    setTherapyTargetPatientId(session.patient_id);
    setIsTherapyModalOpen(true);
  };

  const handleAddSaleForPatient = (patientId: string) => {
    setSalesPreselectedPatientId(patientId);
    setActiveTab('sales');
  };

  const handleQuickAction = (actionType: string) => {
    switch (actionType) {
      case 'new-patient':
        handleOpenAddPatient();
        break;
      case 'new-therapy':
        handleOpenNewTherapy();
        break;
      case 'new-sale':
        setActiveTab('sales');
        break;
      case 'new-invoice':
        setActiveTab('invoices');
        break;
      case 'export':
      case 'import':
        setActiveTab('import_export');
        break;
      case 'reports':
        setActiveTab('reports_finance');
        break;
      case 'settings':
        setActiveTab('settings');
        break;
      case 'herbal':
        setActiveTab('herbal');
        break;
      case 'services':
        setActiveTab('services');
        break;
      default:
        setActiveTab(actionType);
        break;
    }
  };

  const selectedPatient = selectedPatientId
    ? patients.find((p) => p.id === selectedPatientId) || null
    : null;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-col antialiased">
      {/* Top Fixed Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      {/* Main Layout Area */}
      <div className="flex flex-1">
        {/* Desktop Collapsible Sidebar & Mobile Drawer */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleNavigate}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 lg:pl-72 mb-16 lg:mb-0">
          <div className="max-w-7xl mx-auto">
            {/* View Router */}
            {activeTab === 'dashboard' && (
              <DashboardView
                onNavigate={handleNavigate}
                onOpenQuickAction={handleQuickAction}
              />
            )}

            {activeTab === 'patients' &&
              (selectedPatient ? (
                <PatientDetailView
                  patient={selectedPatient}
                  onBack={() => setSelectedPatientId(null)}
                  onEditPatient={handleOpenEditPatient}
                  onAddTherapy={(pId) => handleOpenNewTherapy(pId)}
                  onAddSale={(pId) => handleAddSaleForPatient(pId)}
                  onViewInvoice={() => setActiveTab('invoices')}
                />
              ) : (
                <PatientListView
                  onSelectPatient={handleSelectPatient}
                  onOpenAddModal={handleOpenAddPatient}
                  onOpenEditModal={handleOpenEditPatient}
                />
              ))}

            {activeTab === 'therapy' && (
              <TherapyListView
                onSelectPatient={handleSelectPatient}
                onOpenAddModal={() => handleOpenNewTherapy()}
                onOpenEditModal={handleOpenEditTherapy}
              />
            )}

            {activeTab === 'sales' && (
              <SalesView
                preselectedPatientId={salesPreselectedPatientId}
                onViewInvoice={() => setActiveTab('invoices')}
                onOpenNewPatientModal={handleOpenAddPatient}
              />
            )}

            {activeTab === 'invoices' && (
              <InvoiceListView
                onSelectPatient={handleSelectPatient}
              />
            )}

            {activeTab === 'services' && <ServicesView />}

            {activeTab === 'herbal' && <HerbalProductsView />}

            {activeTab === 'finance' && <FinanceView />}

            {(activeTab === 'financial-report' || activeTab === 'reports_finance') && <FinancialReportView />}

            {(activeTab === 'reports' || activeTab === 'reports_clinical') && <ClinicalReportsView />}

            {(activeTab === 'import-export' || activeTab === 'import_export') && <ImportExportView />}

            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        onOpenSidebar={() => setIsMobileSidebarOpen(true)}
        onOpenQuickAction={handleQuickAction}
      />

      {/* Floating WhatsApp Booking Button */}
      <FloatingWhatsApp />

      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Global Search Modal (Ctrl/Cmd + K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Patient Add / Edit Modal */}
      <PatientFormModal
        isOpen={isPatientModalOpen}
        onClose={() => {
          setIsPatientModalOpen(false);
          setPatientToEdit(null);
        }}
        patientToEdit={patientToEdit}
      />

      {/* Therapy Session Add / Edit Modal */}
      <TherapyFormModal
        isOpen={isTherapyModalOpen}
        onClose={() => {
          setIsTherapyModalOpen(false);
          setTherapyToEdit(null);
          setTherapyTargetPatientId(undefined);
        }}
        initialPatientId={therapyTargetPatientId}
        sessionToEdit={therapyToEdit}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ClinicProvider>
        <ClinicAppContent />
      </ClinicProvider>
    </AuthProvider>
  );
}
