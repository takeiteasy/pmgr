require 'redis'
require 'securerandom'

db = Redis.new

db.flushall

types = [:projects, :notes]

types.each do |type|
  for i in 1..10
    id = SecureRandom.uuid
    
    db.hmset id, :title, "test#{i}", :type, type
    
    db.sadd type, id
  end
end

types.each do |type|
  db.smembers(type).each do |x|
    puts "#{type}, #{x}"
    
    puts db.hgetall x
  end
end