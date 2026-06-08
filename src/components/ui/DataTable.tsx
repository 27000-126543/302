import React from 'react';

interface Column {
  key: string;
  title: string;
  render?: (value: any, record: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (record: any) => void;
}

const DataTable: React.FC<DataTableProps> = ({ columns, data, onRowClick }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-cyan-500/20">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cyan-500/30 bg-[#0d1f3c]/60">
            {columns.map((col) => (
              <th key={col.key} className="text-left px-4 py-2.5 text-cyan-400 font-medium whitespace-nowrap">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((record, rowIdx) => (
            <tr
              key={rowIdx}
              onClick={() => onRowClick?.(record)}
              className={`border-b border-cyan-500/10 transition-colors ${
                rowIdx % 2 === 0 ? 'bg-[#0a1628]/40' : 'bg-[#0d1f3c]/30'
              } hover:bg-cyan-500/10 ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2.5 text-gray-300 whitespace-nowrap">
                  {col.render ? col.render(record[col.key], record) : record[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-gray-600">
                暂无数据
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
