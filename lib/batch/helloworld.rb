class Batch::Helloworld
  def self.tweet(contents,user_name)
    #user_name = "askldjfaksjdfkl"
    user = User.find_by_provider_and_uid("twitter",user_name)
    test = Twitter::REST::Client.new do |config|
      config.consumer_key        = "teo4El7z2U10XsJIGjRiH0ncc"
      config.consumer_secret     = "SGTvNiDG1ghPm9w0uQIx2fUa7E2oXxUyBcCQBNLBDgg23heDvN"
      config.access_token        = user.access_token
      config.access_token_secret = user.access_token_secret
    end       
    test.update(contents)
  end

  def self.tes(contents,user_name)
    p contents
    p user_name
  end

  def self.timeto_i
    Twicont.find_each do |user|
      t = Time.now
      s = Time.new(2015,07,12,20,00)
      u = user.twidt
      p t
      p s
      p u
      p t.to_i
      p s.to_i
      p u.to_i
    end
  end

  def self.referen
    Twicont.find_each do |user|
      now = Time.now
      puts now;
      if user.twidt.to_i < now.to_i
        self.tweet(user.twict,user.user_id)
        user.destroy
      end
    end
  end

  def self.timeset
    time = Time.new(2015,07,12,10,10)
    user_name = "askldjfaksjdfkl"
    contents = "Hello  Wod2ldddaa2d !!!!!"
    t = Twicont.create(:twidt => time,:twict => contents,:name => user_name)
  end
end