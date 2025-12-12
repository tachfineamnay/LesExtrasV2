import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { SignContractDto } from './dto';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser, CurrentUserPayload } from '../common/decorators';

@ApiTags('contracts')
@Controller('contracts')
export class ContractsController {
    constructor(private readonly contractsService: ContractsService) { }

    @Post('sign')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Signer un contrat de mission SOS' })
    async sign(
        @CurrentUser() user: CurrentUserPayload,
        @Body() dto: SignContractDto,
    ) {
        return this.contractsService.signContract(user.id, dto);
    }
}
