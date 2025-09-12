import { Controller } from '@nestjs/common';
import { ThirdPartyService } from './third-party.service';

@Controller('third-party')
export class ThirdPartyController {
  constructor(private readonly thirdPartyService: ThirdPartyService) {}
}
