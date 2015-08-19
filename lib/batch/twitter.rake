require 'twitter'
		 
namespace :twitter do
  desc "tweet hello"
  task :tweet => :environment do
    client = get_twitter_client
    tweet = "Hello Twitter!"
    update(client, tweet)
  end
end
 
def get_twitter_client 
  client = Twitter::REST::Client.new do |config|
  config.consumer_key        = "teo4El7z2U10XsJIGjRiH0ncc"
  config.consumer_secret     = "SGTvNiDG1ghPm9w0uQIx2fUa7E2oXxUyBcCQBNLBDgg23heDvN"
  config.access_token        = "3196022940-o1xoO0WOacsaRfXpqO2z948p7sjlNIQkKlUK50e"
  config.access_token_secret = "g2m4nLSpVO5KAjLG077iWZ9D77F1F7i4mzbp9cXnWhfXK" 
  end
  client
end
 
def update(client, tweet)
  begin
    tweet = (tweet.length > 140) ? tweet[0..139].to_s : tweet
    client.update(tweet.chomp)
  rescue => e
    Rails.logger.error "<<twitter.rake::tweet.update ERROR : #{e.message}>>"
  end
end