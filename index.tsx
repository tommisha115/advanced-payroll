/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
 import { useState, useEffect, useRef } from 'react';
 import ReactDOM from 'react-dom/client';
 import * as XLSX from 'xlsx';
 import { createClient, SupabaseClient } from '@supabase/supabase-js';
 
 // --- Supabase Client Setup ---
 const supabaseUrl = 'https://tcthikbpjqnkvywtsyma.supabase.co';
 const supabaseKey =
   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdGhpa2JwanFua3Z5d3RzeW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MTUzNjQsImV4cCI6MjA3MzI5MTM2NH0.0KZLCp0HfR1XNywIBE3DLZOBCHp4UHR8Kq3ciYD4R5A';
 
 const isSupabaseConfigured = supabaseUrl && supabaseKey;
 
 let supabase: SupabaseClient | null = null;
 if (isSupabaseConfigured) {
   supabase = createClient(supabaseUrl, supabaseKey);
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
 
 const COMPANIES = ['ሐሴት ቁ.1', 'ሐሴት ቁ.2', 'ሐሴት 1ኛ ደረጃ'];
 
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
 
 // --- Printable Report Component ---
 interface PrintableReportProps {
   results: PayrollResult[];
   scope: string | null;
 }
 
 const PrintableReport = ({ results, scope }: PrintableReportProps) => {
   if (results.length === 0 || !scope) return null;
 
   const reportDate = new Date().toLocaleDateString('en-US', {
     year: 'numeric',
     month: 'long',
     day: 'numeric',
   });
 
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
         <div className="print-header-details">
           <span>
             For: <strong>{scope}</strong>
           </span>
           <span>
             Date: <strong>{reportDate}</strong>
           </span>
         </div>
       </header>
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
             <th>Signature</th>
           </tr>
         </thead>
         <tbody>
           {results.map((result) => (
             <tr key={result.id}>
               <td>{result.name}</td>
               <td>{formatCurrency(result.grossSalary)}</td>
               <td>{formatCurrency(result.pension11)}</td>
               <td>{formatCurrency(result.transportAllowance)}</td>
               <td>{formatCurrency(result.phoneAllowance)}</td>
               <td>{formatCurrency(result.houseRentAllowance)}</td>
               <td>{formatCurrency(result.taxable)}</td>
               <td>{formatCurrency(result.totalGrossPay)}</td>
               <td>{formatCurrency(result.pension7)}</td>
               <td>{formatCurrency(result.pension18)}</td>
               <td>{formatCurrency(result.incomeTax)}</td>
               <td>{formatCurrency(result.totalDeduction)}</td>
               <td>{formatCurrency(result.netPay)}</td>
               <td className="signature-cell"></td>
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
             <td>
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
             <td>
               <strong>{formatCurrency(totals.totalGrossPay)}</strong>
             </td>
             <td>
               <strong>{formatCurrency(totals.pension7)}</strong>
             </td>
             <td>
               <strong>{formatCurrency(totals.pension18)}</strong>
             </td>
             <td>
               <strong>{formatCurrency(totals.incomeTax)}</strong>
             </td>
             <td>
               <strong>{formatCurrency(totals.totalDeduction)}</strong>
             </td>
             <td>
               <strong>{formatCurrency(totals.netPay)}</strong>
             </td>
             <td className="signature-cell"></td>
           </tr>
         </tfoot>
       </table>
     </div>
   );
 };
 
 // --- App Component ---
 
 function App() {
   const [employees, setEmployees] = useState<Employee[]>([]);
 
   // Form state
   const [employeeName, setEmployeeName] = useState('');
   const [employeeRole, setEmployeeRole] = useState(ROLES[0]);
   const [employeeCompany, setEmployeeCompany] = useState(COMPANIES[0]);
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
   const [loading, setLoading] = useState(true); // Start loading on initial load
   const [error, setError] = useState('');
 
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
     } catch (err: any) {
       setError(`Failed to fetch employees: ${err.message}`);
     } finally {
       setLoading(false);
     }
   };
 
   useEffect(() => {
     if (!isSupabaseConfigured) {
       setError(
         'Supabase is not configured. Please add your project URL and anon key in index.tsx.'
       );
       setLoading(false);
       return;
     }
     fetchEmployees();
   }, []);
 
   const resetForm = () => {
     setEmployeeName('');
     setEmployeeRole(ROLES[0]);
     setEmployeeCompany(COMPANIES[0]);
     setEmployeeGrossSalary('');
     setEmployeeTransport('');
     setEmployeePhone('');
     setEmployeeHouseRent('');
     setEmployeeHasPension(true);
     setEditingEmployeeId(null);
   };
 
   const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     if (!supabase) return;
 
     const trimmedName = employeeName.trim();
     if (!trimmedName) {
       setError('Employee name cannot be empty.');
       return;
     }
 
     // Check for duplicates. When editing, we exclude the current employee from the check.
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
 
     // Clear any existing validation errors before proceeding
     setError('');
 
     if (trimmedName && employeeRole) {
       // Map camelCase from form to snake_case for the DB
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
           // WORKAROUND: The database schema for the 'employees' table might be missing a
           // default value for the 'created_at' column. To prevent a "not-null constraint"
           // error, we explicitly set the timestamp from the client on creation.
           // The best practice is to set a default value of 'now()' for this column
           // in the Supabase dashboard.
           const { error } = await supabase
             .from('employees')
             .insert({ ...employeeData, created_at: new Date().toISOString() });
           if (error) throw error;
         }
         resetForm();
         fetchEmployees(); // Re-fetch employees to show the update
       } catch (err: any) {
         setError(`Failed to save employee: ${err.message}`);
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
       fetchEmployees(); // Re-fetch employees to show the update
       if (id === editingEmployeeId) {
         resetForm();
       }
     } catch (err: any) {
       setError(`Failed to remove employee: ${err.message}`);
     }
   };
 
   const handleCalculatePayroll = () => {
     setPayrollResults([]);
     setError('');
     setPayrollReportScope(selectedCompany);
 
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
       };
     });
 
     setPayrollResults(finalResults);
   };
 
   const handleExportToExcel = () => {
     if (payrollResults.length === 0 || !payrollReportScope) return;
 
     // --- 1. DEFINE STYLES ---
     const titleStyle = {
       font: { name: 'Arial', sz: 16, bold: true },
       alignment: { horizontal: 'center', vertical: 'center' },
     };
     const headerStyle = {
       font: { name: 'Arial', sz: 11, bold: true, color: { rgb: 'FFFFFFFF' } },
       fill: { fgColor: { rgb: 'FF4A90E2' } },
       alignment: { horizontal: 'center' },
       border: {
         top: { style: 'thin', color: { rgb: 'FF000000' } },
         bottom: { style: 'thin', color: { rgb: 'FF000000' } },
         left: { style: 'thin', color: { rgb: 'FF000000' } },
         right: { style: 'thin', color: { rgb: 'FF000000' } },
       },
     };
     const currencyFormat = '"ETB" #,##0.00';
     const border = {
       top: { style: 'thin', color: { rgb: 'FFDFE3E8' } },
       bottom: { style: 'thin', color: { rgb: 'FFDFE3E8' } },
       left: { style: 'thin', color: { rgb: 'FFDFE3E8' } },
       right: { style: 'thin', color: { rgb: 'FFDFE3E8' } },
     };
 
     const defaultCellStyle = { border, font: { name: 'Arial', sz: 10 } };
     const currencyCellStyle = { ...defaultCellStyle, numFmt: currencyFormat };
     const deductionStyle = {
       ...currencyCellStyle,
       fill: { fgColor: { rgb: 'FFFFEBEE' } },
     };
     const totalGrossStyle = {
       ...currencyCellStyle,
       font: { ...currencyCellStyle.font, bold: true },
     };
     const netPayStyle = {
       ...currencyCellStyle,
       font: { ...currencyCellStyle.font, bold: true },
       fill: { fgColor: { rgb: 'FFE6F6E6' } },
     };
     const totalRowStyle = {
       font: { name: 'Arial', sz: 11, bold: true },
       border: { top: { style: 'medium', color: { rgb: 'FF000000' } } },
     };
     const totalCurrencyStyle = { ...totalRowStyle, numFmt: currencyFormat };
 
     // --- 2. PREPARE DATA ---
     const headers = [
       'Employee',
       'Role',
       'Gross Salary',
       'Pension (11%)',
       'Transport',
       'Phone',
       'House Rent',
       'Taxable',
       'Total Gross',
       'Pension (7%)',
       'Pension (18%)',
       'Income Tax',
       'Total Deduction',
       'Net Pay',
     ];
 
     // Map payrollResults to an array of objects with keys matching headers
     const data = payrollResults.map((result) => ({
       Employee: result.name,
       Role: result.role,
       'Gross Salary': result.grossSalary,
       'Pension (11%)': result.pension11,
       Transport: result.transportAllowance,
       Phone: result.phoneAllowance,
       'House Rent': result.houseRentAllowance,
       Taxable: result.taxable,
       'Total Gross': result.totalGrossPay,
       'Pension (7%)': result.pension7,
       'Pension (18%)': result.pension18,
       'Income Tax': result.incomeTax,
       'Total Deduction': result.totalDeduction,
       'Net Pay': result.netPay,
     }));
 
     // Calculate Totals
     const totals = data.reduce(
       (acc, row) => {
         acc['Gross Salary'] += row['Gross Salary'];
         acc['Total Deduction'] += row['Total Deduction'];
         acc['Net Pay'] += row['Net Pay'];
         return acc;
       },
       { 'Gross Salary': 0, 'Total Deduction': 0, 'Net Pay': 0 }
     );
 
     const totalsRow = {
       Employee: 'TOTALS',
       'Gross Salary': totals['Gross Salary'],
       'Total Deduction': totals['Total Deduction'],
       'Net Pay': totals['Net Pay'],
     };
 
     // --- 3. CREATE WORKSHEET ---
     const title = `Payroll Report for ${payrollReportScope}`;
     const ws = XLSX.utils.json_to_sheet(data, {
       header: headers,
       skipHeader: true,
     }); // Create sheet from data, skip auto-header
 
     // Add title and headers manually
     XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' });
     XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A3' });
 
     // Append totals row
     XLSX.utils.sheet_add_json(ws, [totalsRow], {
       header: headers,
       skipHeader: true,
       origin: -1,
     });
 
     // Merge title cell
     const merge = { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } };
     ws['!merges'] = [merge];
 
     // --- 4. APPLY STYLES TO CELLS ---
     const range = XLSX.utils.decode_range(ws['!ref']);
     const headerRow = 2; // Row 3 in Excel (0-indexed)
     const firstDataRow = 3;
     const totalRowIndex = firstDataRow + data.length;
 
     for (let R = range.s.r; R <= range.e.r; ++R) {
       for (let C = range.s.c; C <= range.e.c; ++C) {
         const cell_address = { c: C, r: R };
         const cell_ref = XLSX.utils.encode_cell(cell_address);
         let cell = ws[cell_ref];
         if (!cell) continue;
 
         if (R === 0) {
           // Title Row
           cell.s = titleStyle;
         } else if (R === headerRow) {
           // Header Row
           cell.s = headerStyle;
         } else if (R >= firstDataRow && R < totalRowIndex) {
           // Data Rows
           const header = headers[C];
           cell.s =
             typeof cell.v === 'number' ? currencyCellStyle : defaultCellStyle;
           if (
             [
               'Pension (11%)',
               'Pension (7%)',
               'Pension (18%)',
               'Income Tax',
               'Total Deduction',
             ].includes(header)
           ) {
             cell.s = deductionStyle;
           } else if (header === 'Total Gross') {
             cell.s = totalGrossStyle;
           } else if (header === 'Net Pay') {
             cell.s = netPayStyle;
           }
         } else if (R === totalRowIndex) {
           // Totals Row
           cell.s =
             typeof cell.v === 'number' ? totalCurrencyStyle : totalRowStyle;
         }
       }
     }
 
     // --- 5. SET COLUMN WIDTHS ---
     const colWidths = headers.map((header) => {
       let maxLen = header.length;
       data.forEach((row) => {
         const cellValue = row[header];
         if (cellValue != null) {
           const cellStr =
             typeof cellValue === 'number'
               ? formatCurrency(cellValue)
               : String(cellValue);
           if (cellStr.length > maxLen) maxLen = cellStr.length;
         }
       });
       return { wch: maxLen + 2 };
     });
     ws['!cols'] = colWidths;
 
     // --- 6. CREATE AND DOWNLOAD WORKBOOK ---
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, 'Payroll Results');
     const fileName = `PayrollResults_${payrollReportScope.replace(
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
 
   return (
     <>
       {payslipData && (
         <PayslipModal
           result={payslipData}
           onClose={() => setPayslipData(null)}
         />
       )}
       <div className="container screen-only">
         <header>
           <h1>Payroll Calculator</h1>
           <p>
             Manage employees and calculate payroll with automated tax
             calculations.
           </p>
         </header>
 
         <main className="management-grid">
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
                     disabled={!isSupabaseConfigured}
                   >
                     {COMPANIES.map((company) => (
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
                     onChange={(e) =>
                       setEmployeeHasPension(e.target.checked)
                     }
                     disabled={!isSupabaseConfigured}
                   />
                   <label htmlFor="pension">
                     Apply Pension Deductions
                   </label>
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
                   {COMPANIES.map((company) => (
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
 
         <div className="calculate-section">
           <button onClick={handleCalculatePayroll} className="calculate-btn">
             {`Calculate Payroll for ${selectedCompany}`}
           </button>
         </div>
 
         {error && <div className="error-message">{error}</div>}
 
         {payrollResults.length > 0 && payrollReportScope && (
           <div className="card results-card">
             <div className="card-header">
               <h2>Payroll Results for {payrollReportScope}</h2>
               <div className="results-actions">
                 <button
                   onClick={() => window.print()}
                   className="btn-secondary btn-icon"
                   aria-label="Print payroll report"
                 >
                   <PrintIcon /> Print Report
                 </button>
                 <button
                   onClick={handleExportToExcel}
                   className="btn-secondary btn-icon"
                   aria-label="Export payroll results to Excel"
                 >
                   <ExportIcon /> Export to Excel
                 </button>
               </div>
             </div>
             <div className="table-container">
               <table>
                 <thead>
                   <tr>
                     <th>Employee</th>
                     <th>Role</th>
                     <th>Gross Salary</th>
                     <th>Pension (11%)</th>
                     <th>Transport</th>
                     <th>Phone</th>
                     <th>House Rent</th>
                     <th>Taxable</th>
                     <th>Total Gross</th>
                     <th>Pension (7%)</th>
                     <th>Pension (18%)</th>
                     <th className="tax-header">Income Tax</th>
                     <th>Total Deduction</th>
                     <th>Net Pay</th>
                     <th>Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {payrollResults.map((result) => (
                     <tr key={result.id}>
                       <td>{result.name}</td>
                       <td>{result.role}</td>
                       <td>{formatCurrency(result.grossSalary)}</td>
                       <td className="deduction-cell">
                         {formatCurrency(result.pension11)}
                       </td>
                       <td>{formatCurrency(result.transportAllowance)}</td>
                       <td>{formatCurrency(result.phoneAllowance)}</td>
                       <td>{formatCurrency(result.houseRentAllowance)}</td>
                       <td>{formatCurrency(result.taxable)}</td>
                       <td className="total-gross-cell">
                         {formatCurrency(result.totalGrossPay)}
                       </td>
                       <td className="deduction-cell">
                         {formatCurrency(result.pension7)}
                       </td>
                       <td className="deduction-cell">
                         {formatCurrency(result.pension18)}
                       </td>
                       <td className="tax-cell">
                         {formatCurrency(result.incomeTax)}
                       </td>
                       <td className="deduction-cell">
                         {formatCurrency(result.totalDeduction)}
                       </td>
                       <td className="net-pay-cell">
                         {formatCurrency(result.netPay)}
                       </td>
                       <td>
                         <button
                           onClick={() => setPayslipData(result)}
                           className="btn-icon btn-secondary"
                           aria-label="Print Payslip"
                         >
                           <PrintIcon />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
         )}
       </div>
       <PrintableReport results={payrollResults} scope={payrollReportScope} />
     </>
   );
 }
 
 const root = ReactDOM.createRoot(document.getElementById('root'));
 root.render(<App />);
 