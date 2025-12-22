import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto';
import { JwtAuthGuard, MissionAccessGuard } from '../common/guards';
import { CurrentUser, CurrentUserPayload } from '../common/decorators';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, MissionAccessGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Envoyer un message interne' })
    async sendMessage(
        @CurrentUser() user: CurrentUserPayload,
        @Body() dto: SendMessageDto,
    ) {
        return this.messagesService.send(user.id, dto);
    }
}
