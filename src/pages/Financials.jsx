import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DollarSign, TrendingUp, CreditCard, FileText } from "lucide-react";

import { DataTable } from "../components/shared/DataTable";
import { StatCard } from "../components/shared/StatCard";
import { Loader } from "../components/common/Loader";

import {
  setInvoices,
  setPayments,
  setLoading,
  setError,
} from "../store/slices/financialSlice";

import { fetchInvoices, fetchPayments } from "../api/financials";

export const Financials = () => {
  const dispatch = useDispatch();
  const { invoices, payments, loading } = useSelector((s) => s.financials);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const [invoicesRes, paymentsRes] = await Promise.all([
        fetchInvoices(),
        fetchPayments(),
      ]);

      dispatch(setInvoices(invoicesRes?.invoices || []));
      dispatch(setPayments(paymentsRes?.payments || []));
    } catch (err) {
      console.error(err);
      dispatch(setError("Failed to load financial data"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const invoiceColumns = [
    { header: "Invoice ID", accessor: "id" },
    { header: "Booking ID", accessor: "bookingId" },
    { header: "Guest", accessor: "guestName" },

    {
      header: "Amount",
      render: (row) => `$${(row.amount ?? 0).toLocaleString()}`
    },
    {
      header: "Paid",
      render: (row) => `$${(row.paidAmount ?? 0).toLocaleString()}`
    },
    {
      header: "Due Date",
      render: (row) =>
        row?.dueDate ? new Date(row.dueDate).toLocaleDateString() : "-"
    },
    {
      header: "Status",
      render: (row) => {
        const colors = {
          paid: "bg-green-100 text-green-700",
          pending: "bg-yellow-100 text-yellow-700",
          overdue: "bg-red-100 text-red-700",
        };
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              colors[row.status] || "bg-slate-100 text-slate-700"
            }`}
          >
            {row.status}
          </span>
        );
      },
    },
  ];

  if (loading) return <Loader fullScreen />;

  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.amount ?? 0), 0);

  const pendingAmount = invoices
    .filter((i) => i.status === "pending")
    .reduce((s, i) => s + ((i.amount ?? 0) - (i.paidAmount ?? 0)), 0);

  const overdueAmount = invoices
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + (i.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financials</h1>
        <p className="text-slate-600">
          Track payments, invoices, and revenue
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} color="green" />
        <StatCard title="Pending Payments" value={`$${pendingAmount.toLocaleString()}`} icon={TrendingUp} color="orange" />
        <StatCard title="Overdue Amount" value={`$${overdueAmount.toLocaleString()}`} icon={FileText} color="red" />
        <StatCard title="Total Invoices" value={invoices.length} icon={CreditCard} color="blue" />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Recent Invoices</h2>
        <DataTable data={invoices} columns={invoiceColumns} />
      </div>
    </div>
  );
};
