require 'redis'
require 'securerandom'

db = Redis.new

db.flushall

types = [:projects, :todos, :snippets]

for j in 0..2
  type = types[j]
  for i in 1..10
    id = SecureRandom.uuid

    pid = "#{type}:#{id}"

    db.hmset pid, :title, "test#{i}"

    db.zadd type, 0, id
  end
end

for j in 0..2
  type = types[j]
  db.zrange(type, 0, -1).each do |x|
    puts "#{type}:#{x}"
    puts db.hget "#{type}:#{x}", :title
  end
end