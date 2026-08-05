import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Province } from "../entities/province.entity";

@Injectable()
export class ProvinceService {
  constructor(
    @InjectRepository(Province) private provinceRepo: Repository<Province>
  ) {}

  async getProvinceList(countryAlpha2?: string): Promise<string[]> {
    const query = this.provinceRepo
      .createQueryBuilder("province")
      .select("province.provinceName", "provinceName");

    if (countryAlpha2) {
      query.where("province.countryAlpha2 = :countryAlpha2", { countryAlpha2 });
    }

    const rawProvinces = await query.getRawMany();

    return rawProvinces.map((p) => p.provinceName);
  }

  async isValidProvince(
    provinces: string[],
    countryAlpha2?: string
  ): Promise<boolean> {
    if (!Array.isArray(provinces)) return false;

    const validProvinces: string[] = await this.getProvinceList(countryAlpha2);

    return provinces.every((province) => validProvinces.includes(province));
  }
}
