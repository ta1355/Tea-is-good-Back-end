import { PartialType } from '@nestjs/mapped-types';
import { CreateTeaRatingDto } from './create-tea-rating.dto';

export class UpdateTeaRatingDto extends PartialType(CreateTeaRatingDto) {}
