import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Select, Spin } from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";

export interface CompanySelectProps {
  value?: number;
  onChange?: (companyId: number | undefined) => void;
  placeholder?: string;
}

interface OrganisationNameResult {
  companyId: number;
  name: string;
  state: string | number;
  taxId: string;
}

const isOrganisationNameResult = (
  value: unknown
): value is OrganisationNameResult => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.companyId === "number" &&
    typeof record.name === "string" &&
    (typeof record.state === "string" || typeof record.state === "number") &&
    typeof record.taxId === "string"
  );
};

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Reusable remote-search company picker. Debounces free-text input, queries
 * `national/organisation/queryNames` for active companies matching the
 * keyword, and reports the selected `companyId` via `onChange`. Designed to
 * be dropped straight into an antd `Form.Item` as a controlled input.
 */
const CompanySelect: FC<CompanySelectProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  const { post } = useConnection();
  const [options, setOptions] = useState<OrganisationNameResult[]>([]);
  const [selectedOption, setSelectedOption] = useState<
    OrganisationNameResult | undefined
  >(undefined);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      clearTimeout(debounceTimer.current ?? undefined);
    };
  }, []);

  const fetchCompanies = useCallback(
    async (keyword: string) => {
      setLoading(true);
      try {
        const result: { data: unknown } = await post(
          API_PATHS.ORGANIZATION_NAMES,
          {
            page: 1,
            size: 20,
            filterAnd: keyword
              ? [
                  {
                    key: "name",
                    operation: "like",
                    value: "%" + keyword + "%",
                  },
                ]
              : undefined,
            sort: {
              key: "name",
              order: "ASC",
            },
          }
        );
        const list = Array.isArray(result.data) ? result.data : [];
        setOptions(list.filter(isOrganisationNameResult));
      } catch (error) {
        console.log("Error searching companies", error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [post]
  );

  const handleSearch = useCallback(
    (keyword: string) => {
      clearTimeout(debounceTimer.current ?? undefined);
      debounceTimer.current = setTimeout(() => {
        fetchCompanies(keyword);
      }, SEARCH_DEBOUNCE_MS);
    },
    [fetchCompanies]
  );

  const handleChange = (companyId: number | undefined) => {
    onChange?.(companyId);
    setSelectedOption(options.find((o) => o.companyId === companyId));
  };

  // Keep the currently selected company visible as an option even after a
  // later search replaces the result list, so the Select can still resolve
  // a label for `value`.
  const mergedOptions = useMemo(() => {
    if (
      selectedOption &&
      !options.some((o) => o.companyId === selectedOption.companyId)
    ) {
      return [selectedOption, ...options];
    }
    return options;
  }, [options, selectedOption]);

  return (
    <Select
      showSearch
      allowClear
      value={value}
      placeholder={placeholder ?? "Search company by name"}
      filterOption={false}
      onSearch={handleSearch}
      onChange={handleChange}
      notFoundContent={loading ? <Spin size="small" /> : null}
      options={mergedOptions.map((company) => ({
        value: company.companyId,
        label: `${company.name} (${company.taxId})`,
      }))}
      style={{ width: "100%" }}
    />
  );
};

export default CompanySelect;
