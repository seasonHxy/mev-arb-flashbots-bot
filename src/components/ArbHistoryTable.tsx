import { useEffect, useState } from "react";

export default function ArbHistoryTable() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then(setRecords);
  }, []);

  return (
    <table className="table-auto w-full">
      <thead>
        <tr>
          <th>Time</th>
          <th>In</th>
          <th>Out</th>
          <th>Profit</th>
          <th>Tx</th>
        </tr>
      </thead>
      <tbody>
        {records.map((r, i) => (
          <tr key={i}>
            <td>{new Date(r.timestamp).toLocaleTimeString()}</td>
            <td>{r.token_in}</td>
            <td>{r.token_out}</td>
            <td>{r.profit_eth.toFixed(6)}</td>
            <td>
              {r.tx_hash ? (
                <a href={`https://etherscan.io/tx/${r.tx_hash}`}>view</a>
              ) : (
                "-"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
