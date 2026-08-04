import React, { useEffect, useState } from "react";
import { Table } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";

interface CertifierRow {
  companyId: number;
  name: string;
  country: string;
  website: string;
  address: string;
  logo: string;
}

const columns = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Country",
    dataIndex: "country",
    key: "country",
  },
  {
    title: "Website",
    dataIndex: "website",
    key: "website",
    render: (website: string) =>
      website ? (
        <a href={website} target="_blank" rel="noopener noreferrer">
          {website}
        </a>
      ) : (
        "-"
      ),
  },
  {
    title: "Address",
    dataIndex: "address",
    key: "address",
    render: (address: string) => address || "-",
  },
];

// Public directory of active independent certifiers (Validation/Verification
// Agencies), backed by real Company records with companyRole = IC. Mirrors
// SRN Indonesia's Instruments > Validation/Verification Agency listing.
const VerificationAgencyList = () => {
  const { get } = useConnection();

  const [rows, setRows] = useState<CertifierRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCertifiers = async () => {
      setLoading(true);
      try {
        const response = await get(API_PATHS.CERTIFIERS_PUBLIC_LIST);
        const data = response?.data as CertifierRow[] | undefined;
        setRows(data ?? []);
      } catch (error) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCertifiers();
  }, [get]);

  if (!loading && rows.length === 0) {
    return <p>No verification agencies registered yet.</p>;
  }

  return (
    <Table
      rowKey="companyId"
      columns={columns}
      dataSource={rows}
      loading={loading}
      pagination={false}
    />
  );
};

export default VerificationAgencyList;
