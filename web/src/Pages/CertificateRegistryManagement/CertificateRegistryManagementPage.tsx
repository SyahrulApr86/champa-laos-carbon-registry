import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Divider, Input, InputNumber, Select, Space, Table, Tag, Typography, message } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { Role } from "../../Definitions/Enums/role.enum";
import CertificateLotEditor from "./CertificateLotEditor";
import {
  archiveCertificateLot,
  createCertificateLot,
  getCertificateLot,
  listCertificateLots,
  recordCertificateLifecycle,
  updateCertificateLot,
} from "./certificateRegistryManagement.api";
import {
  CertificateEvent,
  CertificateLifecycleEvent,
  CertificateLotDetail,
  CertificateLotFormValues,
  CertificateLotSummary,
} from "./certificateRegistryManagement.types";

const lifecycleOptions: CertificateLifecycleEvent[] = ["ISSUED", "TRANSFERRED", "RETIRED", "CANCELLED", "ASSIGNED_TO_EXCHANGE", "RELEASED", "REVERSED"];

const CertificateRegistryManagementPage = () => {
  const connection = useConnection();
  const { userInfoState } = useUserContext();
  const [rows, setRows] = useState<CertificateLotSummary[]>([]);
  const [selected, setSelected] = useState<CertificateLotDetail>();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [eventType, setEventType] = useState<CertificateLifecycleEvent>("ISSUED");
  const [quantity, setQuantity] = useState<number>();
  const [sourcePortionId, setSourcePortionId] = useState<string>();
  const [toOwnerCompanyId, setToOwnerCompanyId] = useState<string>();
  const [parentEventId, setParentEventId] = useState<string>();
  const [reason, setReason] = useState("");

  const isAuthorized = [CompanyRole.DESIGNATED_NATIONAL_AUTHORITY, CompanyRole.MINISTRY].includes(userInfoState.companyRole as CompanyRole)
    && [Role.Root, Role.Admin, Role.Manager].includes(userInfoState.userRole as Role);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listCertificateLots(connection, { q: query });
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch {
      setRows([]);
      message.error("Certificate registry management is unavailable");
    } finally {
      setLoading(false);
    }
  }, [connection, query]);

  useEffect(() => {
    if (isAuthorized) void loadRows();
  }, [isAuthorized, loadRows]);

  const selectLot = async (certificateLotId: string) => {
    try {
      const response = await getCertificateLot(connection, certificateLotId);
      setSelected(response.data);
    } catch {
      message.error("Unable to load certificate lot detail");
    }
  };

  const saveLot = async (values: CertificateLotFormValues) => {
    setActioning(true);
    try {
      if (selected) {
        await updateCertificateLot(connection, selected.lot.certificate_lot_id, values);
        await selectLot(selected.lot.certificate_lot_id);
      } else {
        const response = await createCertificateLot(connection, values);
        const created = response.data as { certificateLotId?: string };
        if (created.certificateLotId) await selectLot(created.certificateLotId);
      }
      await loadRows();
      message.success("Certificate lot saved");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Unable to save certificate lot");
    } finally {
      setActioning(false);
    }
  };

  const archiveLot = async () => {
    if (!selected || !window.confirm("Archive this unissued certificate lot?")) return;
    setActioning(true);
    try {
      await archiveCertificateLot(connection, selected.lot.certificate_lot_id, reason || "Administrative archive");
      setSelected(undefined);
      await loadRows();
      message.success("Certificate lot archived");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Unable to archive certificate lot");
    } finally {
      setActioning(false);
    }
  };

  const recordEvent = async () => {
    if (!selected || !quantity) return;
    setActioning(true);
    try {
      const command: Record<string, unknown> = {
        idempotencyKey: `${eventType.toLowerCase()}-${selected.lot.certificate_lot_id}-${Date.now()}`,
        quantity,
      };
      if (sourcePortionId) command.sourcePortionId = sourcePortionId;
      if (toOwnerCompanyId) command.toOwnerCompanyId = toOwnerCompanyId;
      if (parentEventId) command.parentEventId = parentEventId;
      if (reason) command.reason = reason;
      await recordCertificateLifecycle(connection, selected.lot.certificate_lot_id, eventType, command);
      await selectLot(selected.lot.certificate_lot_id);
      await loadRows();
      setQuantity(undefined);
      message.success(`${eventType} event recorded`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Unable to record certificate event");
    } finally {
      setActioning(false);
    }
  };

  if (!isAuthorized) {
    return <Alert type="error" message="Certificate registry management requires an authenticated DNA or Ministry manager/admin account." />;
  }

  const events: CertificateEvent[] = selected?.events ?? [];
  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={2}>Certificate registry management</Typography.Title>
      <Typography.Paragraph>Canonical lots are editable only before issuance. Ledger events are immutable and corrected with a reversal.</Typography.Paragraph>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search placeholder="Search certificate, lot or registry number" allowClear onSearch={setQuery} style={{ width: 360 }} />
        <Button onClick={() => { setSelected(undefined); setReason(""); }}>New lot</Button>
      </Space>
      <Table
        rowKey={(row) => row.lot.certificate_lot_id}
        loading={loading}
        dataSource={rows}
        columns={[
          { title: "Certificate", dataIndex: "certificate_id" },
          { title: "Registry number", render: (_: unknown, row: CertificateLotSummary) => row.lot.registry_number ?? "—" },
          { title: "Quantity", render: (_: unknown, row: CertificateLotSummary) => `${row.lot.issued_quantity} ${row.lot.unit}` },
          { title: "Available", render: (_: unknown, row: CertificateLotSummary) => row.balances.available ?? 0 },
          { title: "Status", render: (_: unknown, row: CertificateLotSummary) => <Tag color={row.lot.archived_at ? "default" : row.event_count ? "green" : "gold"}>{row.lot.archived_at ? "Archived" : row.event_count ? "Issued" : "Draft"}</Tag> },
          { title: "Action", render: (_: unknown, row: CertificateLotSummary) => <Button size="small" onClick={() => void selectLot(row.lot.certificate_lot_id)}>Open</Button> },
        ]}
      />
      <Divider />
      <CertificateLotEditor lot={selected?.lot} onSubmit={saveLot} onCancel={() => setSelected(undefined)} />
      {selected && (
        <Card title="Lifecycle event" size="small" style={{ marginTop: 16 }}>
          <Space wrap>
            <Select value={eventType} onChange={setEventType} options={lifecycleOptions.map((value) => ({ value, label: value }))} style={{ width: 210 }} />
            <InputNumber min={0.000001} precision={6} value={quantity} onChange={(value) => setQuantity(value ?? undefined)} placeholder="Quantity" />
            <Select allowClear value={sourcePortionId} onChange={setSourcePortionId} placeholder="Source portion" style={{ width: 220 }} options={selected.portions.map((portion) => ({ value: portion.certificate_portion_id, label: `${portion.state}: ${portion.quantity}` }))} />
            <Input value={toOwnerCompanyId} onChange={(event) => setToOwnerCompanyId(event.target.value || undefined)} placeholder="Recipient company ID" />
            <Select allowClear value={parentEventId} onChange={setParentEventId} placeholder="Original event for reversal" style={{ width: 220 }} options={events.map((event) => ({ value: event.event_id, label: `${event.event_type}: ${event.quantity}` }))} />
            <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Audit reason" style={{ width: 240 }} />
            <Button type="primary" loading={actioning} onClick={() => void recordEvent()}>Record event</Button>
            {!selected.lot.issued_at && !selected.events.length && <Button danger loading={actioning} onClick={() => void archiveLot()}>Archive draft</Button>}
          </Space>
        </Card>
      )}
    </div>
  );
};

export default CertificateRegistryManagementPage;
