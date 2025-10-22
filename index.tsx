/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import * as XLSX from 'xlsx';
import {
  createClient,
  SupabaseClient,
  Session,
} from '@supabase/supabase-js';

// Fix for Vite environment variables not being recognized by TypeScript
declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  }
}

// --- Supabase Client Setup ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const isSupabaseConfigured = supabaseUrl && supabasePublishableKey;

let supabase: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabasePublishableKey);
}

// --- Constants, Helper Functions, and Type Definitions ---

const ROLES = [
  'Director',
  'Assistant Director',
  'Teacher',
  'Assistant Teacher',
  'Janitor',
  'Keeper',
];

const ETHIOPIAN_MONTHS = [
  'Meskerem',
  'Tikimt',
  'Hidar',
  'Tahsas',
  'Tir',
  'Yekatit',
  'Megabit',
  'Miyazya',
  'Ginbot',
  'Sene',
  'Hamle',
  'Nehase',
  'Pagume',
];

interface Employee {
  id: number;
  name: string;
  role: string;
  company: string;
  grossSalary: number;
  transportAllowance: number;
  phoneAllowance: number;
  houseRentAllowance: number;
  hasPension: boolean;
}

interface PayrollResult {
  id: number;
  name: string;
  role: string;
  company: string;
  grossSalary: number;
  pension11: number;
  transportAllowance: number;
  phoneAllowance: number;
  houseRentAllowance: number;
  taxable: number;
  totalGrossPay: number;
  pension7: number;
  pension18: number;
  incomeTax: number;
  totalDeduction: number;
  netPay: number;
  hasPension: boolean; // Pass this through for formula generation
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
  }).format(amount);
};

const calculateIncomeTax = (taxableAmount: number): number => {
  if (taxableAmount <= 2000) return 0;
  if (taxableAmount <= 4000) return taxableAmount * 0.15 - 300;
  if (taxableAmount <= 7000) return taxableAmount * 0.2 - 500;
  if (taxableAmount <= 10000) return taxableAmount * 0.25 - 850;
  if (taxableAmount <= 14000) return taxableAmount * 0.3 - 1350;
  return taxableAmount * 0.35 - 2050; // for > 14000
};

// --- SVG Icons ---

const ViewPayslipIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);

const RemoveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const ExportIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const PrintIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 6 2 18 2 18 9"></polyline>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
    <rect x="6" y="14" width="12" height="8"></rect>
  </svg>
);

// --- Payslip Modal Component ---

interface PayslipModalProps {
  result: PayrollResult;
  onClose: () => void;
}

const PayslipModal = ({ result, onClose }: PayslipModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  const payPeriod = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-content"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div id="payslip-to-print">
          <div className="payslip-header">
            <div className="company-details">
              <h1 className="company-name">{result.company}</h1>
              <p className="company-address">123 Business Rd., Business City</p>
            </div>
            <span className="payslip-title">PAYSLIP</span>
          </div>

          <div className="payslip-employee-info">
            <div>
              <strong>Employee:</strong> {result.name}
            </div>
            <div>
              <strong>Role:</strong> {result.role}
            </div>
            <div>
              <strong>Pay Period:</strong> {payPeriod}
            </div>
          </div>

          <div className="payslip-grid">
            <div className="payslip-section">
              <h3>Earnings</h3>
              <table className="payslip-table">
                <tbody>
                  <tr>
                    <td>Gross Salary</td>
                    <td className="amount">
                      {formatCurrency(result.grossSalary)}
                    </td>
                  </tr>
                  <tr>
                    <td>Transport Allowance</td>
                    <td className="amount">
                      {formatCurrency(result.transportAllowance)}
                    </td>
                  </tr>
                  <tr>
                    <td>Phone Allowance</td>
                    <td className="amount">
                      {formatCurrency(result.phoneAllowance)}
                    </td>
                  </tr>
                  <tr>
                    <td>House Rent Allowance</td>
                    <td className="amount">
                      {formatCurrency(result.houseRentAllowance)}
                    </td>
                  </tr>
                  <tr>
                    <td>Pension (11%)</td>
                    <td className="amount">
                      {formatCurrency(result.pension11)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td>
                      <strong>Total Gross Pay</strong>
                    </td>
                    <td className="amount">
                      <strong>{formatCurrency(result.totalGrossPay)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="payslip-section">
              <h3>Deductions</h3>
              <table className="payslip-table">
                <tbody>
                  <tr>
                    <td>Income Tax</td>
                    <td className="amount">
                      {formatCurrency(result.incomeTax)}
                    </td>
                  </tr>
                  <tr>
                    <td>Pension (18% - Post-Tax)</td>
                    <td className="amount">
                      {formatCurrency(result.pension18)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td>
                      <strong>Total Deductions</strong>
                    </td>
                    <td className="amount">
                      <strong>{formatCurrency(result.totalDeduction)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="payslip-net-pay">
            <span className="net-pay-label">Net Pay</span>
            <span className="net-pay-amount">
              {formatCurrency(result.netPay)}
            </span>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={handlePrint} className="btn-icon">
            <PrintIcon /> Print
          </button>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Settings Modal Component ---
interface SettingsModalProps {
  onClose: () => void;
  onProfileUpdate: (newData: {
    businessName: string;
    companies: string[];
  }) => void;
  currentBusinessName: string;
  currentCompanies: string[];
}

const SettingsModal = ({
  onClose,
  onProfileUpdate,
  currentBusinessName,
  currentCompanies,
}: SettingsModalProps) => {
  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Profile State
  const [updatedBusinessName, setUpdatedBusinessName] =
    useState(currentBusinessName);
  const [updatedCompanies, setUpdatedCompanies] = useState([...currentCompanies]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (error) {
      setPasswordError(`Failed to update password: ${error.message}`);
    } else {
      setPasswordSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000); // Clear message after 3s
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!updatedBusinessName.trim()) {
      setProfileError('Business name cannot be empty.');
      return;
    }
    if (updatedCompanies.some((c) => !c.trim())) {
      setProfileError('All company names must be filled out.');
      return;
    }

    setProfileLoading(true);
    const newData = {
      businessName: updatedBusinessName.trim(),
      companies: updatedCompanies.map((c) => c.trim()),
    };

    const { error } = await supabase.auth.updateUser({ data: newData });
    setProfileLoading(false);

    if (error) {
      setProfileError(`Failed to update profile: ${error.message}`);
    } else {
      onProfileUpdate(newData);
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 3000);
    }
  };

  const handleCompanyChange = (index: number, value: string) => {
    const newCompanies = [...updatedCompanies];
    newCompanies[index] = value;
    setUpdatedCompanies(newCompanies);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content settings-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Settings</h2>
        </div>
        <div className="settings-grid">
          {/* Change Password Section */}
          <div className="settings-section">
            <h3>Change Password</h3>
            <form onSubmit={handlePasswordUpdate}>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <button type="submit" disabled={passwordLoading}>
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
              {passwordError && (
                <div className="error-message">{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className="success-message">{passwordSuccess}</div>
              )}
            </form>
          </div>

          {/* Edit Business Info Section */}
          <div className="settings-section">
            <h3>Edit Business Info</h3>
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label htmlFor="settingsBusinessName">Business Name</label>
                <input
                  id="settingsBusinessName"
                  type="text"
                  value={updatedBusinessName}
                  onChange={(e) => setUpdatedBusinessName(e.target.value)}
                  required
                />
              </div>
              {updatedCompanies.map((company, index) => (
                <div className="form-group" key={index}>
                  <label htmlFor={`settingsCompanyName${index}`}>
                    Company #{index + 1} Name
                  </label>
                  <input
                    id={`settingsCompanyName${index}`}
                    type="text"
                    value={company}
                    onChange={(e) => handleCompanyChange(index, e.target.value)}
                    required
                  />
                </div>
              ))}
              <button type="submit" disabled={profileLoading}>
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
              {profileError && (
                <div className="error-message">{profileError}</div>
              )}
              {profileSuccess && (
                <div className="success-message">{profileSuccess}</div>
              )}
            </form>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
// --- Delete Confirmation Modal Component ---

interface DeleteConfirmationModalProps {
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  error: string | null;
}

const DeleteConfirmationModal = ({
  onClose,
  onConfirm,
  loading,
  error,
}: DeleteConfirmationModalProps) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content confirm-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Delete Account</h3>
        <p>
          Are you sure you want to delete your account? This action is permanent
          and cannot be undone. All your employee and payroll data will be lost.
        </p>
        {error && <div className="error-message">{error}</div>}
        <div className="confirm-modal-actions">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger" disabled={loading}>
            {loading ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Printable Report Component ---
interface PrintableReportProps {
  results: PayrollResult[];
  scope: string | null;
  reportDate: string;
  businessName: string;
  onViewPayslip: (result: PayrollResult) => void;
}

const PrintableReport = ({
  results,
  scope,
  reportDate,
  businessName,
  onViewPayslip,
}: PrintableReportProps) => {
  if (results.length === 0 || !scope) return null;

  const totals = results.reduce(
    (acc, result) => {
      acc.grossSalary += result.grossSalary;
      acc.pension11 += result.pension11;
      acc.transportAllowance += result.transportAllowance;
      acc.phoneAllowance += result.phoneAllowance;
      acc.houseRentAllowance += result.houseRentAllowance;
      acc.taxable += result.taxable;
      acc.totalGrossPay += result.totalGrossPay;
      acc.pension7 += result.pension7;
      acc.pension18 += result.pension18;
      acc.incomeTax += result.incomeTax;
      acc.totalDeduction += result.totalDeduction;
      acc.netPay += result.netPay;
      return acc;
    },
    {
      grossSalary: 0,
      pension11: 0,
      transportAllowance: 0,
      phoneAllowance: 0,
      houseRentAllowance: 0,
      taxable: 0,
      totalGrossPay: 0,
      pension7: 0,
      pension18: 0,
      incomeTax: 0,
      totalDeduction: 0,
      netPay: 0,
    }
  );

  return (
    <div className="printable-report">
      <header className="print-header">
        <h1>Payroll Report</h1>
        <h2>{businessName}</h2>
        <div className="print-header-details">
          <span>
            For: <strong>{scope}</strong>
          </span>
          <span>
            Date: <strong>{reportDate}</strong>
          </span>
        </div>
      </header>
      <div className="table-wrapper">
        <table className="print-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Gross Salary</th>
              <th>Pension (11%)</th>
              <th>Transport</th>
              <th>Phone</th>
              <th>House Rent</th>
              <th>Taxable</th>
              <th>Total Gross</th>
              <th>Pension (7%)</th>
              <th>Pension (18%)</th>
              <th>Income Tax</th>
              <th>Total Deduction</th>
              <th>Net Pay</th>
              <th className="screen-only">Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.id}>
                <td>{result.name}</td>
                <td>{formatCurrency(result.grossSalary)}</td>
                <td className="pension-deduction bold-column">
                  {formatCurrency(result.pension11)}
                </td>
                <td>{formatCurrency(result.transportAllowance)}</td>
                <td>{formatCurrency(result.phoneAllowance)}</td>
                <td>{formatCurrency(result.houseRentAllowance)}</td>
                <td>{formatCurrency(result.taxable)}</td>
                <td className="bold-column">
                  {formatCurrency(result.totalGrossPay)}
                </td>
                <td className="bold-column">{formatCurrency(result.pension7)}</td>
                <td className="bold-column">
                  {formatCurrency(result.pension18)}
                </td>
                <td className="bold-column">
                  {formatCurrency(result.incomeTax)}
                </td>
                <td className="total-deduction bold-column">
                  {formatCurrency(result.totalDeduction)}
                </td>
                <td className="total-netpay bold-column">
                  {formatCurrency(result.netPay)}
                </td>
                <td className="screen-only">
                  <button
                    onClick={() => onViewPayslip(result)}
                    className="btn-icon-only"
                    aria-label="View Payslip"
                  >
                    <ViewPayslipIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>
                <strong>TOTALS</strong>
              </td>
              <td>
                <strong>{formatCurrency(totals.grossSalary)}</strong>
              </td>
              <td className="pension-deduction bold-column">
                <strong>{formatCurrency(totals.pension11)}</strong>
              </td>
              <td>
                <strong>{formatCurrency(totals.transportAllowance)}</strong>
              </td>
              <td>
                <strong>{formatCurrency(totals.phoneAllowance)}</strong>
              </td>
              <td>
                <strong>{formatCurrency(totals.houseRentAllowance)}</strong>
              </td>
              <td>
                <strong>{formatCurrency(totals.taxable)}</strong>
              </td>
              <td className="bold-column">
                <strong>{formatCurrency(totals.totalGrossPay)}</strong>
              </td>
              <td className="bold-column">
                <strong>{formatCurrency(totals.pension7)}</strong>
              </td>
              <td className="bold-column">
                <strong>{formatCurrency(totals.pension18)}</strong>
              </td>
              <td className="bold-column">
                <strong>{formatCurrency(totals.incomeTax)}</strong>
              </td>
              <td className="total-deduction bold-column">
                <strong>{formatCurrency(totals.totalDeduction)}</strong>
              </td>
              <td className="total-netpay bold-column">
                <strong>{formatCurrency(totals.netPay)}</strong>
              </td>
              <td className="screen-only"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <footer className="report-footer">
        <div className="signature-block">
          <h4>ከፋይ</h4>
          <p>ስም፡ _______________________</p>
          <p>ፊርማ፡ ______________________</p>
          <p>ቀን፡ _________________________</p>
        </div>
        <div className="signature-block">
          <h4>ያፀደቀው</h4>
          <p>ስም፡ _______________________</p>
          <p>ፊርማ፡ ______________________</p>
          <p>ቀን፡ _________________________</p>
        </div>
      </footer>
    </div>
  );
};

// --- App Component ---

function App() {
  // Auth state
  const [session, setSession] = useState<Session | null>(null);
  const [authView, setAuthView] = useState<'signIn' | 'signUp'>('signIn');
  const [authStep, setAuthStep] = useState<'form' | 'verify'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Sign-up specific state
  const [businessName, setBusinessName] = useState('');
  const [numCompanies, setNumCompanies] = useState(1);
  const [companyNames, setCompanyNames] = useState(['']);

  // App state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [userBusinessName, setUserBusinessName] = useState('');
  const [userCompanies, setUserCompanies] = useState<string[]>([]);

  // Form state
  const [employeeName, setEmployeeName] = useState('');
  const [employeeRole, setEmployeeRole] = useState(ROLES[0]);
  const [employeeCompany, setEmployeeCompany] = useState('');
  const [employeeGrossSalary, setEmployeeGrossSalary] = useState('');
  const [employeeTransport, setEmployeeTransport] = useState('');
  const [employeePhone, setEmployeePhone] = useState('');
  const [employeeHouseRent, setEmployeeHouseRent] = useState('');
  const [employeeHasPension, setEmployeeHasPension] = useState(true);

  // Editing state
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(
    null
  );

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('All Companies');

  // Payroll calculation state
  const [payrollResults, setPayrollResults] = useState<PayrollResult[]>([]);
  const [payrollReportScope, setPayrollReportScope] = useState<string | null>(
    null
  );
  const [payslipData, setPayslipData] = useState<PayrollResult | null>(null);
  const [loading, setLoading] = useState(true); // For employee data fetching
  const [error, setError] = useState('');

  // Report Date State
  const [reportMonth, setReportMonth] = useState(ETHIOPIAN_MONTHS[0]);
  const [reportYear, setReportYear] = useState(
    new Date().getFullYear().toString()
  );
  const [reportDateString, setReportDateString] = useState('');

  // Fail-fast check for Supabase configuration
  if (!isSupabaseConfigured) {
    return (
      <div className="auth-container">
        <div className="card auth-card">
          <div className="error-message">
            <strong>Configuration Error</strong>
            <p style={{ margin: '0.5rem 0 0 0', textAlign: 'left' }}>
              The application is not connected to a backend database. Please
              ensure the Supabase URL and Publishable Key are correctly
              configured in your environment variables.
            </p>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    setAppLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        const metadata = session.user?.user_metadata;
        const companies = metadata?.companies || [];
        setUserCompanies(companies);
        setUserBusinessName(metadata?.businessName || '');
        if (companies.length > 0) {
          setEmployeeCompany(companies[0]);
        }
      }
      setAppLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        const metadata = session.user?.user_metadata;
        const companies = metadata?.companies || [];
        setUserCompanies(companies);
        setUserBusinessName(metadata?.businessName || '');
        if (companies.length > 0 && !employeeCompany) {
          setEmployeeCompany(companies[0]);
        }
      } else {
        // Reset on logout
        setUserCompanies([]);
        setUserBusinessName('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchEmployees = async () => {
    if (!supabase) return;
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) throw error;
      if (data) {
        // Map snake_case from DB to camelCase for the app
        const formattedData = data.map((emp) => ({
          id: emp.id,
          name: emp.name,
          role: emp.role,
          company: emp.company,
          grossSalary: emp.gross_salary,
          transportAllowance: emp.transport_allowance,
          phoneAllowance: emp.phone_allowance,
          houseRentAllowance: emp.house_rent_allowance,
          hasPension: emp.has_retirement,
        }));
        setEmployees(formattedData);
      }
    } catch (error: any) {
      setError(`Failed to fetch employees: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchEmployees();
    }
  }, [session]);

  const resetForm = () => {
    setEmployeeName('');
    setEmployeeRole(ROLES[0]);
    setEmployeeCompany(userCompanies[0] || '');
    setEmployeeGrossSalary('');
    setEmployeeTransport('');
    setEmployeePhone('');
    setEmployeeHouseRent('');
    setEmployeeHasPension(true);
    setEditingEmployeeId(null);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase || !session) return;

    const trimmedName = employeeName.trim();
    if (!trimmedName) {
      setError('Employee name cannot be empty.');
      return;
    }

    const isDuplicate = employees.some(
      (emp) =>
        emp.name.toLowerCase() === trimmedName.toLowerCase() &&
        emp.id !== editingEmployeeId
    );

    if (isDuplicate) {
      setError(
        'An employee with this name already exists. Please use a different name.'
      );
      return;
    }

    setError('');

    if (trimmedName && employeeRole) {
      const employeeData = {
        name: trimmedName,
        role: employeeRole,
        company: employeeCompany,
        gross_salary: parseFloat(employeeGrossSalary) || 0,
        transport_allowance: parseFloat(employeeTransport) || 0,
        phone_allowance: parseFloat(employeePhone) || 0,
        house_rent_allowance: parseFloat(employeeHouseRent) || 0,
        has_retirement: employeeHasPension,
      };

      try {
        if (editingEmployeeId) {
          const { error } = await supabase
            .from('employees')
            .update(employeeData)
            .eq('id', editingEmployeeId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('employees').insert({
            ...employeeData,
            user_id: session.user.id,
          });
          if (error) throw error;
        }
        resetForm();
        fetchEmployees();
      } catch (error: any) {
        setError(`Failed to save employee: ${error.message}`);
      }
    }
  };

  const handleStartEdit = (employee: Employee) => {
    setEditingEmployeeId(employee.id);
    setEmployeeName(employee.name);
    setEmployeeRole(employee.role);
    setEmployeeCompany(employee.company);
    setEmployeeGrossSalary(String(employee.grossSalary));
    setEmployeeTransport(String(employee.transportAllowance));
    setEmployeePhone(String(employee.phoneAllowance));
    setEmployeeHouseRent(String(employee.houseRentAllowance));
    setEmployeeHasPension(employee.hasPension);
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleRemoveEmployee = async (id: number) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      fetchEmployees();
      if (id === editingEmployeeId) {
        resetForm();
      }
    } catch (error: any) {
      setError(`Failed to remove employee: ${error.message}`);
    }
  };

  const handleCalculatePayroll = () => {
    setPayrollResults([]);
    setError('');

    if (!reportMonth || !reportYear.trim()) {
      setError('Please select a month and enter a year for the report.');
      return;
    }

    const employeesToCalculate = employees.filter((emp) => {
      if (selectedCompany === 'All Companies') {
        return true;
      }
      return emp.company === selectedCompany;
    });

    const employeesWithData = employeesToCalculate.filter(
      (emp) => emp.grossSalary > 0
    );

    if (employeesWithData.length === 0) {
      setError(
        `Please add at least one employee with a gross salary for ${selectedCompany}.`
      );
      return;
    }

    const finalResults: PayrollResult[] = employeesWithData.map((emp) => {
      const pension11 = emp.hasPension ? emp.grossSalary * 0.11 : 0;
      const totalGrossPay =
        emp.grossSalary +
        pension11 +
        emp.transportAllowance +
        emp.phoneAllowance +
        emp.houseRentAllowance;

      const pension7 = emp.hasPension ? emp.grossSalary * 0.07 : 0;
      const pension18 = emp.hasPension ? emp.grossSalary * 0.18 : 0;

      const taxable =
        emp.grossSalary + emp.phoneAllowance + emp.houseRentAllowance;

      const incomeTax = calculateIncomeTax(taxable);
      const totalDeduction = pension18 + incomeTax;
      const finalNetPay = totalGrossPay - totalDeduction;

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        company: emp.company,
        grossSalary: emp.grossSalary,
        transportAllowance: emp.transportAllowance,
        phoneAllowance: emp.phoneAllowance,
        houseRentAllowance: emp.houseRentAllowance,
        taxable,
        totalGrossPay,
        pension11,
        pension7,
        pension18,
        incomeTax,
        totalDeduction,
        netPay: finalNetPay,
        hasPension: emp.hasPension,
      };
    });

    setPayrollResults(finalResults);
    setPayrollReportScope(selectedCompany);
    const formattedDate = `${reportMonth}, ${reportYear}`;
    setReportDateString(formattedDate);
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleExportToExcel = () => {
    if (payrollResults.length === 0 || !payrollReportScope) return;

    // --- 1. DEFINE STYLES ---
    const numberFormat = '#,##0'; // Format with commas, no decimals
    const border = {
      top: { style: 'thin', color: { rgb: 'FF000000' } },
      bottom: { style: 'thin', color: { rgb: 'FF000000' } },
      left: { style: 'thin', color: { rgb: 'FF000000' } },
      right: { style: 'thin', color: { rgb: 'FF000000' } },
    };

    const titleStyle = {
      font: { name: 'Calibri', sz: 16, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
    const businessNameStyle = {
      font: { name: 'Calibri', sz: 16, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
    const detailsStyle = { font: { name: 'Calibri', sz: 11 } };
    const dateStyle = {
      font: { name: 'Calibri', sz: 11 },
      alignment: { horizontal: 'right' },
    };
    const headerStyle = {
      font: { name: 'Calibri', sz: 11, bold: true },
      border,
      alignment: {
        horizontal: 'center',
        vertical: 'center',
        wrapText: true,
      },
    };
    const defaultCellStyle = {
      border,
      font: { name: 'Calibri', sz: 11 },
      alignment: { horizontal: 'left' },
    };
    const numberCellStyle = {
      border,
      font: { name: 'Calibri', sz: 11 },
      numFmt: numberFormat,
      alignment: { horizontal: 'right' },
    };
    const totalRowStyle = {
      font: { name: 'Calibri', sz: 11, bold: true },
      border,
      alignment: { horizontal: 'left' },
    };
    const totalNumberStyle = {
      ...totalRowStyle,
      numFmt: numberFormat,
      alignment: { horizontal: 'right' },
    };
    const signatureTitleStyle = { font: { name: 'Nyala', sz: 12, bold: true } };
    const signatureFieldStyle = { font: { name: 'Nyala', sz: 12 } };

    // --- 2. PREPARE DATA ---
    const headers = [
      'Employee',
      'Gross\nSalary',
      'Pension\n(11%)',
      'Transpor\nt',
      'Phone',
      'House\nRent',
      'Taxable',
      'Total\nGross',
      'Pension\n(7%)',
      'Pension\n(18%)',
      'Income\nTax',
      'Total\nDeduction',
      'Net\nPay',
    ];

    const data = payrollResults.map((result) => [
      result.name,
      result.grossSalary,
      result.pension11,
      result.transportAllowance,
      result.phoneAllowance,
      result.houseRentAllowance,
      result.taxable,
      result.totalGrossPay,
      result.pension7,
      result.pension18,
      result.incomeTax,
      result.totalDeduction,
      result.netPay,
    ]);

    const totals = payrollResults.reduce(
      (acc, result) => {
        // This is now just for initial display, formulas will do the real work
        Object.keys(acc).forEach((key) => {
          acc[key as keyof typeof acc] += result[key as keyof typeof result];
        });
        return acc;
      },
      {
        grossSalary: 0,
        pension11: 0,
        transportAllowance: 0,
        phoneAllowance: 0,
        houseRentAllowance: 0,
        taxable: 0,
        totalGrossPay: 0,
        pension7: 0,
        pension18: 0,
        incomeTax: 0,
        totalDeduction: 0,
        netPay: 0,
      }
    );

    const totalsRow = [
      'TOTALS',
      totals.grossSalary,
      totals.pension11,
      totals.transportAllowance,
      totals.phoneAllowance,
      totals.houseRentAllowance,
      totals.taxable,
      totals.totalGrossPay,
      totals.pension7,
      totals.pension18,
      totals.incomeTax,
      totals.totalDeduction,
      totals.netPay,
    ];

    // --- 3. CREATE WORKSHEET DATA ARRAY ---
    const ws_data = [
      ['Payroll Report'],
      [userBusinessName],
      [],
      [
        `For: ${payrollReportScope}`,
        ...Array(11).fill(null),
        `Date: ${reportDateString}`,
      ],
      headers,
      ...data,
      totalsRow,
      [],
      [],
      [],
      [
        null,
        null,
        'ከፋይ',
        null,
        null,
        null,
        null,
        null,
        null,
        'ያፀደቀው',
      ],
      [
        null,
        null,
        'ስም፡ _______________________',
        ...Array(6).fill(null),
        'ስም፡ _______________________',
      ],
      [
        null,
        null,
        'ፊርማ፡ ______________________',
        ...Array(6).fill(null),
        'ፊርማ፡ ______________________',
      ],
      [
        null,
        null,
        'ቀን፡ _________________________',
        ...Array(6).fill(null),
        'ቀን፡ _________________________',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // --- 4. INSERT FORMULAS ---
    const dataStartRow = 6; // Excel row number (1-based)
    payrollResults.forEach((result, index) => {
      const row = dataStartRow + index;
      const pensionCheck = result.hasPension;

      // C: Pension (11%)
      ws[`C${row}`] = { t: 'f', f: pensionCheck ? `B${row}*0.11` : '0' };
      // G: Taxable
      ws[`G${row}`] = { t: 'f', f: `B${row}+E${row}+F${row}` };
      // H: Total Gross
      ws[`H${row}`] = { t: 'f', f: `B${row}+C${row}+D${row}+E${row}+F${row}` };
      // I: Pension (7%) - Not part of calculation but good to have
      ws[`I${row}`] = { t: 'f', f: pensionCheck ? `B${row}*0.07` : '0' };
      // J: Pension (18%)
      ws[`J${row}`] = { t: 'f', f: pensionCheck ? `B${row}*0.18` : '0' };
      // K: Income Tax (nested IF for tax brackets)
      ws[`K${row}`] = {
        t: 'f',
        f: `IF(G${row}<=2000,0,IF(G${row}<=4000,G${row}*0.15-300,IF(G${row}<=7000,G${row}*0.2-500,IF(G${row}<=10000,G${row}*0.25-850,IF(G${row}<=14000,G${row}*0.3-1350,G${row}*0.35-2050)))))`,
      };
      // L: Total Deduction
      ws[`L${row}`] = { t: 'f', f: `J${row}+K${row}` };
      // M: Net Pay
      ws[`M${row}`] = { t: 'f', f: `H${row}-L${row}` };
    });

    // Totals Row Formulas
    const totalRowNumber = dataStartRow + payrollResults.length;
    if (payrollResults.length > 0) {
      const lastDataRow = totalRowNumber - 1;
      const columnsToSum = 'BCDEFGHIJKLMNOPQRSTUVWXYZ'
        .slice(0, headers.length - 1)
        .split('');
      columnsToSum.forEach((col) => {
        ws[`${col}${totalRowNumber}`] = {
          t: 'f',
          f: `SUM(${col}${dataStartRow}:${col}${lastDataRow})`,
        };
      });
    }

    // --- 5. SET ROW HEIGHTS & MERGE CELLS ---
    ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 30 };
    ws['!rows'][1] = { hpt: 24 };
    ws['!rows'][4] = { hpt: 40 };

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
    ];

    // --- 6. APPLY STYLES TO CELLS ---
    const headerRowIndex = 4;
    const dataStartIndex = headerRowIndex + 1;
    const totalRowIndex = dataStartIndex + data.length;
    const footerTitleRow = totalRowIndex + 4;

    Object.keys(ws).forEach((cellRef) => {
      if (cellRef.startsWith('!')) return;
      const { c, r } = XLSX.utils.decode_cell(cellRef);
      const cell = ws[cellRef];

      if (r === 0) cell.s = titleStyle;
      else if (r === 1) cell.s = businessNameStyle;
      else if (r === 3) {
        if (c === 0) cell.s = detailsStyle;
        else if (c === headers.length - 1) cell.s = dateStyle;
      } else if (r === headerRowIndex) cell.s = headerStyle;
      else if (r >= dataStartIndex && r < totalRowIndex) {
        cell.s = c === 0 ? defaultCellStyle : numberCellStyle;
      } else if (r === totalRowIndex) {
        cell.s = c === 0 ? totalRowStyle : totalNumberStyle;
      } else if (r === footerTitleRow) {
        if (c === 2 || c === 9) cell.s = signatureTitleStyle;
      } else if (r > footerTitleRow && r <= footerTitleRow + 3) {
        if (c === 2 || c === 9) cell.s = signatureFieldStyle;
      }
    });

    // --- 7. SET COLUMN WIDTHS (Adjusted to match image) ---
    ws['!cols'] = [
      { wch: 8.75 }, // Employee
      { wch: 7.75 }, // Gross Salary
      { wch: 7.75 }, // Pension (11%)
      { wch: 7.75 }, // Transport
      { wch: 7.75 }, // Phone
      { wch: 7.75 }, // House Rent
      { wch: 7.75 }, // Taxable
      { wch: 7.75 }, // Total Gross
      { wch: 7.75 }, // Pension (7%)
      { wch: 7.75 }, // Pension (18%)
      { wch: 7.75 }, // Income Tax
      { wch: 7.75 }, // Total Deduction
      { wch: 7.75 }, // Net Pay
    ];

    // --- 8. CREATE AND DOWNLOAD WORKBOOK ---
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll Report');
    const fileName = `PayrollReport_${payrollReportScope.replace(
      /\s+/g,
      '_'
    )}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleCompanyFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedCompany(e.target.value);
    setPayrollResults([]);
    setPayrollReportScope(null);
    setError('');
  };

  const handleNumCompaniesChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const count = parseInt(e.target.value, 10);
    setNumCompanies(count);
    setCompanyNames((currentNames) => {
      const newNames = [...currentNames].slice(0, count);
      while (newNames.length < count) {
        newNames.push('');
      }
      return newNames;
    });
  };

  const handleCompanyNameChange = (index: number, value: string) => {
    const newCompanyNames = [...companyNames];
    newCompanyNames[index] = value;
    setCompanyNames(newCompanyNames);
  };

  const handleAuthAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) return;
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authView === 'signIn') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        // Sign Up Flow
        if (!username.trim()) throw new Error('Username cannot be empty.');
        if (!businessName.trim())
          throw new Error('Business name cannot be empty.');
        const trimmedCompanyNames = companyNames.map((name) => name.trim());
        if (trimmedCompanyNames.some((name) => name === ''))
          throw new Error('All company names must be filled out.');

        // This creates the user and sends the verification code.
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
              businessName: businessName.trim(),
              companies: trimmedCompanyNames,
            },
          },
        });

        if (error) throw error;
        // Switch to the verification view
        setAuthStep('verify');
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) return;
    setAuthLoading(true);
    setAuthError(null);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'signup',
      });

      if (error) throw error;
      // onAuthStateChange will handle setting the session and navigating
      // to the main app view automatically.
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(
        'Server logout failed, forcing client-side logout:',
        error.message
      );
    }
    setSession(null);
    setAuthStep('form');
    setEmployees([]);
    setPayrollResults([]);
    setUserCompanies([]);
    setUserBusinessName('');
    resetForm();
  };

  const handleDeleteAccount = async () => {
    if (!supabase) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      // This RPC function must be created in your Supabase SQL Editor
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;

      // The RPC call invalidates the session, but we sign out for a clean exit
      await supabase.auth.signOut();
      setSession(null); // Force UI update immediately
      setShowDeleteConfirm(false);
    } catch (error: any) {
      setDeleteError(
        `Failed to delete account: ${error.message}. Ensure the 'delete_user' function exists in Supabase.`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewPayslip = (result: PayrollResult) => {
    setPayslipData(result);
  };

  const handleProfileUpdated = (newData: {
    businessName: string;
    companies: string[];
  }) => {
    setUserBusinessName(newData.businessName);
    setUserCompanies(newData.companies);
  };

  const isEditing = editingEmployeeId !== null;

  const filteredEmployees = employees
    .filter((emp) => {
      if (selectedCompany === 'All Companies') {
        return true;
      }
      return emp.company === selectedCompany;
    })
    .filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (appLoading) {
    return <div className="loading-fullscreen">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="auth-container">
        <div className="card auth-card">
          {authStep === 'form' && (
            <>
              <div className="card-header">
                <h2>
                  {authView === 'signIn' ? 'Welcome Back' : 'Create an Account'}
                </h2>
              </div>
              <p className="auth-description">
                {authView === 'signIn'
                  ? 'Sign in to manage your payroll.'
                  : 'Sign up to get started.'}
              </p>
              <form onSubmit={handleAuthAction} className="auth-form">
                {authView === 'signUp' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="username">Username</label>
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose a username"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="businessName">Business Name</label>
                      <input
                        id="businessName"
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Your Company's Name"
                        required
                      />
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                {authView === 'signUp' && (
                  <>
                    <hr />
                    <div className="company-setup-grid">
                      <h3>Company Setup</h3>
                      <div className="form-group">
                        <label htmlFor="numCompanies">
                          How many companies do you manage?
                        </label>
                        <select
                          id="numCompanies"
                          value={numCompanies}
                          onChange={handleNumCompaniesChange}
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                        </select>
                      </div>
                      {Array.from({ length: numCompanies }).map((_, index) => (
                        <div className="form-group" key={index}>
                          <label htmlFor={`companyName${index + 1}`}>
                            Company #{index + 1} Name
                          </label>
                          <input
                            id={`companyName${index + 1}`}
                            type="text"
                            placeholder={`e.g., My Business Inc.`}
                            value={companyNames[index] || ''}
                            onChange={(e) =>
                              handleCompanyNameChange(index, e.target.value)
                            }
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <button type="submit" disabled={authLoading}>
                  {authLoading
                    ? 'Processing...'
                    : authView === 'signIn'
                    ? 'Sign In'
                    : 'Sign Up'}
                </button>
                {authError && <div className="error-message">{authError}</div>}
              </form>
              <p className="auth-toggle">
                {authView === 'signIn'
                  ? "Don't have an account?"
                  : 'Already have an account?'}
                <button
                  className="btn-link"
                  onClick={() => {
                    setAuthView(authView === 'signIn' ? 'signUp' : 'signIn');
                    setAuthStep('form');
                    setAuthError(null);
                  }}
                >
                  {authView === 'signIn' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </>
          )}

          {authStep === 'verify' && (
            <>
              <div className="card-header">
                <h2>Check your email</h2>
              </div>
              <p className="auth-description">
                We've sent a 6-digit verification code to{' '}
                <strong>{email}</strong>. Please enter it below.
              </p>
              <form onSubmit={handleVerifyCode} className="auth-form">
                <div className="form-group">
                  <label htmlFor="verificationCode">Verification Code</label>
                  <input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    required
                    maxLength={6}
                  />
                </div>
                <button type="submit" disabled={authLoading}>
                  {authLoading ? 'Verifying...' : 'Verify & Sign In'}
                </button>
                {authError && <div className="error-message">{authError}</div>}
              </form>
              <p className="auth-toggle">
                Entered the wrong email?
                <button
                  className="btn-link"
                  onClick={() => {
                    setAuthStep('form');
                    setAuthError(null);
                    setPassword(''); // Clear password for security
                  }}
                >
                  Go Back
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {payslipData && (
        <PayslipModal
          result={payslipData}
          onClose={() => setPayslipData(null)}
        />
      )}
      {showDeleteConfirm && (
        <DeleteConfirmationModal
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteAccount}
          loading={isDeleting}
          error={deleteError}
        />
      )}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          onProfileUpdate={handleProfileUpdated}
          currentBusinessName={userBusinessName}
          currentCompanies={userCompanies}
        />
      )}

      <div className="container">
        <header className="screen-only">
          <div className="header-content">
            <div>
              <h1>{userBusinessName}</h1>
              <p>
                Manage employees and calculate payroll with automated tax
                calculations.
              </p>
            </div>
            <div className="user-info">
              <span className="user-email">
                {session.user?.user_metadata?.username || session.user.email}
              </span>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="btn-secondary"
              >
                Settings
              </button>
              <button onClick={handleLogout} className="btn-secondary">
                Logout
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-danger"
              >
                Delete Account
              </button>
            </div>
          </div>
        </header>

        <main className="management-grid screen-only">
          <div className={`card ${isEditing ? 'is-editing' : ''}`}>
            <div className="card-header">
              <h2>
                {isEditing
                  ? `Editing: ${
                      employees.find((e) => e.id === editingEmployeeId)?.name
                    }`
                  : 'Add New Employee'}
              </h2>
            </div>
            <form onSubmit={handleFormSubmit} className="employee-form">
              <div className="form-grid">
                <div className="form-group span-4">
                  <label htmlFor="employeeName">Employee Name</label>
                  <input
                    id="employeeName"
                    type="text"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="e.g., Jane Doe"
                    required
                    disabled={!isSupabaseConfigured}
                  />
                </div>
                <div className="form-group span-2">
                  <label htmlFor="employeeRole">Role</label>
                  <select
                    id="employeeRole"
                    value={employeeRole}
                    onChange={(e) => setEmployeeRole(e.target.value)}
                    required
                    disabled={!isSupabaseConfigured}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group span-2">
                  <label htmlFor="employeeCompany">Company</label>
                  <select
                    id="employeeCompany"
                    value={employeeCompany}
                    onChange={(e) => setEmployeeCompany(e.target.value)}
                    required
                    disabled={
                      !isSupabaseConfigured || userCompanies.length === 0
                    }
                  >
                    {userCompanies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="grossSalary">Gross Salary</label>
                  <input
                    id="grossSalary"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={employeeGrossSalary}
                    onChange={(e) => setEmployeeGrossSalary(e.target.value)}
                    required
                    disabled={!isSupabaseConfigured}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="transport">Transport</label>
                  <input
                    id="transport"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={employeeTransport}
                    onChange={(e) => setEmployeeTransport(e.target.value)}
                    disabled={!isSupabaseConfigured}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={employeePhone}
                    onChange={(e) => setEmployeePhone(e.target.value)}
                    disabled={!isSupabaseConfigured}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="house">House Rent</label>
                  <input
                    id="house"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={employeeHouseRent}
                    onChange={(e) => setEmployeeHouseRent(e.target.value)}
                    disabled={!isSupabaseConfigured}
                  />
                </div>
                <div className="form-group-checkbox span-4">
                  <input
                    id="pension"
                    type="checkbox"
                    checked={employeeHasPension}
                    onChange={(e) => setEmployeeHasPension(e.target.checked)}
                    disabled={!isSupabaseConfigured}
                  />
                  <label htmlFor="pension">Apply Pension Deductions</label>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" disabled={!isSupabaseConfigured}>
                  {isEditing ? 'Update Employee' : 'Add Employee'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancelEdit}
                    disabled={!isSupabaseConfigured}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Employee Roster</h2>
            </div>

            <div className="filters-container">
              <div className="search-bar-container">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search by name or role..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="company-filter-container">
                <label htmlFor="companyFilter">Company:</label>
                <select
                  id="companyFilter"
                  value={selectedCompany}
                  onChange={handleCompanyFilterChange}
                >
                  <option value="All Companies">All Companies</option>
                  {userCompanies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="employee-roster">
              {loading && <p>Loading employees...</p>}
              {!loading &&
                filteredEmployees.length > 0 &&
                filteredEmployees.map((emp) => (
                  <div key={emp.id} className="roster-item">
                    <div className="roster-item-header">
                      <div className="roster-item-name-role">
                        <span className="employee-name">{emp.name}</span>
                        <div className="employee-badges">
                          <span className="employee-role">{emp.role}</span>
                          <span className="employee-company">
                            {emp.company}
                          </span>
                        </div>
                      </div>
                      <div className="roster-item-actions">
                        <button
                          onClick={() => handleStartEdit(emp)}
                          className="btn-icon btn-secondary"
                          aria-label="Edit Employee"
                          disabled={!isSupabaseConfigured}
                        >
                          <EditIcon /> Edit
                        </button>
                        <button
                          onClick={() => handleRemoveEmployee(emp.id)}
                          className="btn-icon remove-btn"
                          aria-label="Remove Employee"
                          disabled={!isSupabaseConfigured}
                        >
                          <RemoveIcon /> Remove
                        </button>
                      </div>
                    </div>
                    <div className="roster-item-details">
                      <span>
                        Gross:{' '}
                        <strong>{formatCurrency(emp.grossSalary)}</strong>
                      </span>
                      <span>
                        Transport:{' '}
                        <strong>
                          {formatCurrency(emp.transportAllowance)}
                        </strong>
                      </span>
                      <span>
                        Phone:{' '}
                        <strong>
                          {formatCurrency(emp.phoneAllowance)}
                        </strong>
                      </span>
                      <span>
                        House Rent:{' '}
                        <strong>
                          {formatCurrency(emp.houseRentAllowance)}
                        </strong>
                      </span>
                      <span>
                        Pension:{' '}
                        <strong>
                          {emp.hasPension ? 'Enabled' : 'Disabled'}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
              {!loading && filteredEmployees.length === 0 && !error && (
                <p className="no-results-message">
                  No employees match your filter or search.
                </p>
              )}
            </div>
          </div>
        </main>

        <div className="calculate-section screen-only">
          <div className="report-date-picker">
            <div className="form-group">
              <label htmlFor="reportMonth">Report Month</label>
              <select
                id="reportMonth"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
              >
                {ETHIOPIAN_MONTHS.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="reportYear">Report Year (E.C.)</label>
              <input
                id="reportYear"
                type="number"
                placeholder="YYYY"
                value={reportYear}
                onChange={(e) => setReportYear(e.target.value)}
              />
            </div>
          </div>
          <button onClick={handleCalculatePayroll} className="calculate-btn">
            {`Calculate Payroll for ${selectedCompany}`}
          </button>
        </div>

        {error && <div className="error-message screen-only">{error}</div>}

        {payrollResults.length > 0 && payrollReportScope && (
          <div className="card results-card" id="results">
            <div className="card-header screen-only">
              <h2>{`Payroll Results for ${selectedCompany}`}</h2>
              <div className="report-actions">
                <button
                  onClick={() => window.print()}
                  className="btn-secondary btn-icon"
                >
                  <PrintIcon /> Print Report
                </button>
                <button
                  onClick={handleExportToExcel}
                  className="btn-secondary btn-icon"
                >
                  <ExportIcon /> Export to Excel
                </button>
              </div>
            </div>
            <PrintableReport
              results={payrollResults}
              scope={payrollReportScope}
              reportDate={reportDateString}
              businessName={userBusinessName}
              onViewPayslip={handleViewPayslip}
            />
          </div>
        )}
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
