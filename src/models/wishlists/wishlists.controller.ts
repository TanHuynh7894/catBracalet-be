import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { Wishlist } from './entities/wishlist.entity';
import { WishlistsService } from './wishlists.service';

@ApiTags('Wishlists')
@Controller('wishlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a wishlist item' })
  @ApiCreatedResponse({ type: Wishlist })
  create(@Body() createWishlistDto: CreateWishlistDto) {
    return this.wishlistsService.create(createWishlistDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all wishlist items' })
  @ApiOkResponse({ type: Wishlist, isArray: true })
  findAll() {
    return this.wishlistsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get wishlist item by id' })
  @ApiParam({ name: 'id', description: 'Wishlist UUID' })
  @ApiOkResponse({ type: Wishlist })
  findOne(@Param('id') id: string) {
    return this.wishlistsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a wishlist item' })
  @ApiParam({ name: 'id', description: 'Wishlist UUID' })
  remove(@Param('id') id: string) {
    return this.wishlistsService.remove(id);
  }
}
