import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateJobPostingDto {
  @IsNotEmpty({ message: '공고 제목을 입력해주세요.' })
  @IsString({ message: '공고 제목은 문자열 형식이어야 합니다.' })
  title: string;

  @IsNotEmpty({ message: '회사명을 입력해주세요.' })
  @IsString({ message: '회사명은 문자열 형식이어야 합니다.' })
  companyName: string;

  @IsPositive({ message: '잘못된 지역 형식입니다.' })
  @IsNumber({}, { message: '잘못된 지역 형식입니다.' })
  @IsNotEmpty()
  locationId: number;

  @IsNotEmpty({ message: '상세 위치를 입력해주세요.' })
  @IsString({ message: '상세 위치는 문자열 형식이어야 합니다.' })
  detailLocation: string;

  @IsNotEmpty({ message: '공고 내용을 입력해주세요.' })
  @IsString({ message: '공고 내용은 문자열 형식이어야 합니다.' })
  description: string;

  @IsDateString()
  recruitmentStartDate: Date;

  @IsDateString()
  recruitmentEndDate: Date;

  @IsNotEmpty({ message: '직무명을 입력해주세요.' })
  @IsString({ message: '직무명은 문자열 형식이어야 합니다.' })
  jobTitle: string;

  @IsPositive()
  @IsNumber()
  @IsNotEmpty()
  employmentTypeId: number;

  @IsPositive()
  @IsNumber({ maxDecimalPlaces: 2 })
  annualSalary: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSkills: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  contactInfo?: string;

  @IsOptional()
  @IsIn(['active', 'private', 'expired'], {
    message: '유효하지 않은 상태 값입니다',
  })
  status: 'active' | 'private' | 'expired' = 'active';

  constructor(
    title: string,
    companyName: string,
    locationId: number,
    detailLocation: string,
    description: string,
    recruitmentStartDate: Date,
    recruitmentEndDate: Date,
    jobTitle: string,
    employmentTypeId: number,
    annualSalary: number,
    preferredSkills?: string[],
    tags?: string[],
    contactInfo?: string,
    status: 'active' | 'private' | 'expired' = 'active',
  ) {
    this.title = title;
    this.companyName = companyName;
    this.locationId = locationId;
    this.detailLocation = detailLocation;
    this.description = description;
    this.recruitmentStartDate = recruitmentStartDate;
    this.recruitmentEndDate = recruitmentEndDate;
    this.jobTitle = jobTitle;
    this.employmentTypeId = employmentTypeId;
    this.annualSalary = annualSalary;
    this.preferredSkills = preferredSkills || [];
    this.tags = tags;
    this.contactInfo = contactInfo;
    this.status = status;
  }
}
