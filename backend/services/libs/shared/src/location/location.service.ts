import { Injectable } from "@nestjs/common";
import { LocationDataType } from "../enum/locationDataType.enum";
import { Repository } from "typeorm";
import { Country } from "../entities/country.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { HelperService } from "../util/helpers.service";
import { QueryDto } from "../dto/query.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { Region } from "../entities/region.entity";
import { Province } from "../entities/province.entity";
import { District } from "../entities/district.entity";
import { DSDivision } from "../entities/dsDivision.entity";
import { City } from "../entities/city.entity";
import { PostalCode } from "../entities/postal.code.entity";

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Region) private regionRepo: Repository<Region>,
    @InjectRepository(Province) private provinceRepo: Repository<Province>,
    @InjectRepository(District) private districtRepo: Repository<District>,
    @InjectRepository(DSDivision) private divisionRepo: Repository<DSDivision>,
    @InjectRepository(City) private cityRepo: Repository<City>,
    @InjectRepository(PostalCode)
    private postalRepo: Repository<PostalCode>,
    private helperService: HelperService
  ) {}

  async getLocationDataByLocationType(
    locationType: LocationDataType,
    query: QueryDto,
    abilityCondition: string
  ) {
    let dataQueryBuilder = this.getLocationTypeRepo(locationType)
      .createQueryBuilder()
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQL(abilityCondition)
        )
      )
      .orderBy(
        query?.sort?.key && `"${query?.sort?.key}"`,
        query?.sort?.order,
        query?.sort?.nullFirst !== undefined
          ? query?.sort?.nullFirst === true
            ? "NULLS FIRST"
            : "NULLS LAST"
          : undefined
      );

    // Apply pagination if required
    if (query.size && query.page) {
      dataQueryBuilder = dataQueryBuilder
        .offset(query.size * query.page - query.size)
        .limit(query.size);
    }

    const resp = await dataQueryBuilder.getManyAndCount();

    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  async getRegistrationProvinces() {
    const provinces = await this.provinceRepo.find({
      where: { countryAlpha2: "LA" },
      order: { provinceName: "ASC" },
    });
    const uniqueProvinces = Array.from(
      new Map(provinces.map((province) => [province.provinceName, province])).values()
    );
    const [districts, divisions, cities, postalCodes] = await Promise.all([
      this.districtRepo.count({ where: { countryAlpha2: "LA" } }),
      this.divisionRepo.count({ where: { countryAlpha2: "LA" } }),
      this.cityRepo.count({ where: { countryAlpha2: "LA" } }),
      this.postalRepo.count({ where: { countryAlpha2: "LA" } }),
    ]);
    const lowerLevelGeography =
      districts > 0 && divisions > 0 && cities > 0 && postalCodes > 0
        ? "available"
        : "incomplete";

    return {
      data: uniqueProvinces.map((province) => ({
        id: province.key,
        name: province.provinceName,
      })),
      meta: {
        geography: "Lao PDR province",
        source: "configured_location_dataset",
        availability: uniqueProvinces.length ? "available" : "not_configured",
        lower_level_geography: lowerLevelGeography,
        lower_level_counts: { districts, divisions, cities, postalCodes },
      },
    };
  }

  private getLocationTypeRepo(locationDataType: LocationDataType) {
    switch (locationDataType) {
      case LocationDataType.REGION:
        return this.regionRepo;
        break;

      case LocationDataType.PROVINCE:
        return this.provinceRepo;
        break;

      case LocationDataType.DISTRICT:
        return this.districtRepo;
        break;

      case LocationDataType.DIVISION:
        return this.divisionRepo;
        break;

      case LocationDataType.CITY:
        return this.cityRepo;
        break;
      case LocationDataType.POSTAL_CODE:
        return this.postalRepo;
        break;

      default:
        break;
    }
  }
}
