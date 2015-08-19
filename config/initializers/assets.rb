# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
# Rails.application.config.assets.paths << Emoji.images_path

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
# Rails.application.config.assets.precompile += %w( search.js )
Rails.application.config.assets.precompile += %w( style.css )
Rails.application.config.assets.precompile += %w( default.css )
Rails.application.config.assets.precompile += %w( default.date.css )
Rails.application.config.assets.precompile += %w( default.time.css )
Rails.application.config.assets.precompile += %w( jquery.transit.min.js )
Rails.application.config.assets.precompile += %w( picker.js )
Rails.application.config.assets.precompile += %w( picker.date.js )
Rails.application.config.assets.precompile += %w( picker.time.js )
Rails.application.config.assets.precompile += %w( legacy.js )
Rails.application.config.assets.precompile += %w( map.js )