import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { WallFeedService } from './wall-feed.service';
import { GetFeedDto, CreatePostDto } from './dto';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser, CurrentUserPayload } from '../common/decorators';

@ApiTags('wall')
@Controller('wall')
export class WallFeedController {
    constructor(private readonly wallService: WallFeedService) { }

    @Get('feed')
    @ApiOperation({ summary: 'Obtenir le fil d\'actualité mixte (Posts + Missions)' })
    @ApiResponse({ status: 200, description: 'Liste paginée des éléments du fil' })
    async getFeed(@Query() filters: GetFeedDto): Promise<any> {
        return this.wallService.getFeed(filters);
    }

    @Post('posts')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Créer une nouvelle annonce' })
    @ApiResponse({ status: 201, description: 'Annonce créée' })
    async createPost(
        @CurrentUser() user: CurrentUserPayload,
        @Body() dto: CreatePostDto,
    ): Promise<any> {
        return this.wallService.createPost(user.id, dto);
    }

    @Get('posts/:id')
    @ApiOperation({ summary: 'Obtenir le détail d\'une annonce' })
    async getPost(@Param('id') id: string): Promise<any> {
        return this.wallService.getPost(id);
    }

    @Delete('posts/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Supprimer une annonce' })
    async deletePost(
        @Param('id') id: string,
        @CurrentUser() user: CurrentUserPayload,
    ) {
        await this.wallService.deletePost(id, user.id);
        return { success: true };
    }
}
