require 'sinatra'
require 'redis'
require 'json'
require 'securerandom'

$db  = Redis.new
$categories = [:projects, :todos, :snippets]

def menu
  $categories.zip($categories.map do |cat|
    $db.zrange(cat, 0, -1).map do |id|
      {:id => id}.merge $db.hgetall("#{cat}:#{id}")
    end
  end).to_h
end

get '/' do
  erb :index, :locals => {:keys => menu }
end

post '/api/add' do
  data = JSON.parse request.body.read
  id = SecureRandom.uuid
  data['id'] = id
  $db.hmset "#{data["type"]}:#{id}", :title, data['title']
  $db.zadd data['type'], 0, id
  File.open("public/data/#{id}.#{data['type'] == 'projects' ? 'json' : 'md'}", 'w') {}
  return data.to_json
end