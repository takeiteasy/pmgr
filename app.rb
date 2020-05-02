require 'sinatra'
require 'redis'
require 'json'
require 'securerandom'

$db = Redis.new
$categories = [:projects, :todos, :snippets]

def menu
  $categories.zip($categories.map do |cat|
    $db.zrange(cat, 0, -1).map do |id|
      {:id => id}.merge $db.hgetall("#{cat}:#{id}")
    end
  end).to_h
end

def ext type
  type == 'projects' ? 'json' : 'md'
end

get '/' do
  erb :index, :locals => {:keys => menu}
end

post '/api/add' do
  data = JSON.parse request.body.read
  id = SecureRandom.uuid
  data['id'] = id
  $db.hmset "#{data["type"]}:#{id}", :title, data['title']
  $db.zadd data['type'], 0, id
  File.open("public/data/#{id}.#{ext data['type']}", 'w') {}
  return data.to_json
end

post '/api/del' do
  data = JSON.parse request.body.read
  data_path = "public/data/#{data['id']}.#{ext data['type']}"
  File.delete data_path if File.exist? data_path
  return '{"status": 200}'
end